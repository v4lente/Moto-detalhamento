import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, updateSiteSettingsSchema, insertUserSchema, checkoutSchema, registerCustomerSchema, customerLoginSchema, adminCreateCustomerSchema, adminUpdateCustomerSchema, adminCreateUserSchema, adminUpdateUserSchema, createReviewSchema, createAppointmentSchema, updateAppointmentSchema, insertOfferedServiceSchema, updateOfferedServiceSchema } from "@shared/schema";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { sendNewCustomerNotification, sendAppointmentRequestNotification, sendAppointmentStatusUpdateNotification } from "./email";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const buf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(Buffer.from(hashed, "hex"), buf);
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
    customerId?: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Acesso negado. Permissão de admin necessária." });
  }
  next();
}

function requireCustomerAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.customerId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const MemStore = MemoryStore(session);
  
  // Trust proxy for production (Replit uses reverse proxy)
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }
  
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "moto-detalhamento-secret-key",
      resave: false,
      saveUninitialized: false,
      store: new MemStore({ checkPeriod: 86400000 }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      },
    })
  );

  // ===== AUTH ROUTES =====
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const existing = await storage.getUserByUsername(validatedData.username);
      if (existing) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({ ...validatedData, password: hashedPassword });
      req.session.userId = user.id;
      res.status(201).json({ id: user.id, username: user.username });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error registering user:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      req.session.userId = user.id;
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    res.json({ id: user.id, username: user.username });
  });

  // ===== PRODUCTS ROUTES =====
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products-with-stats", async (req, res) => {
    try {
      const products = await storage.getProductsWithStats();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products with stats:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/recent-reviews", async (req, res) => {
    try {
      const limit = parseInt(String(req.query.limit)) || 6;
      const reviews = await storage.getRecentReviews(limit);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching recent reviews:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/service-posts", async (req, res) => {
    try {
      const posts = await storage.getAllServicePosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching service posts:", error);
      res.status(500).json({ error: "Failed to fetch service posts" });
    }
  });

  app.get("/api/service-posts/featured", async (req, res) => {
    try {
      const limit = parseInt(String(req.query.limit)) || 8;
      const posts = await storage.getFeaturedServicePosts(limit);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching featured service posts:", error);
      res.status(500).json({ error: "Failed to fetch service posts" });
    }
  });

  app.get("/api/service-posts/:id", async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid service post ID" });
      }
      const post = await storage.getServicePost(id);
      if (!post) {
        return res.status(404).json({ error: "Service post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching service post:", error);
      res.status(500).json({ error: "Failed to fetch service post" });
    }
  });

  app.post("/api/service-posts", requireAuth, async (req, res) => {
    try {
      const post = await storage.createServicePost(req.body);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating service post:", error);
      res.status(500).json({ error: "Failed to create service post" });
    }
  });

  app.patch("/api/service-posts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid service post ID" });
      }
      const post = await storage.updateServicePost(id, req.body);
      if (!post) {
        return res.status(404).json({ error: "Service post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error updating service post:", error);
      res.status(500).json({ error: "Failed to update service post" });
    }
  });

  app.delete("/api/service-posts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid service post ID" });
      }
      const deleted = await storage.deleteServicePost(id);
      if (!deleted) {
        return res.status(404).json({ error: "Service post not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting service post:", error);
      res.status(500).json({ error: "Failed to delete service post" });
    }
  });

  // ===== APPOINTMENTS ROUTES =====
  app.get("/api/appointments", requireAuth, async (req, res) => {
    try {
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid appointment ID" });
      }
      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      console.error("Error fetching appointment:", error);
      res.status(500).json({ error: "Failed to fetch appointment" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const validatedData = createAppointmentSchema.parse(req.body);
      
      let customerId: string | null = null;
      let customerName = validatedData.customerName || "";
      let customerPhone = validatedData.customerPhone || "";
      let customerEmail = validatedData.customerEmail || null;
      
      // Check if logged in customer
      if (req.session.customerId) {
        const customer = await storage.getCustomer(req.session.customerId);
        if (customer) {
          customerId = customer.id;
          customerName = customer.name;
          customerPhone = customer.phone;
          customerEmail = customer.email;
        }
      }
      
      if (!customerName || !customerPhone) {
        return res.status(400).json({ error: "Nome e telefone são obrigatórios" });
      }
      
      const appointment = await storage.createAppointment({
        customerId,
        customerName,
        customerPhone,
        customerEmail,
        vehicleInfo: validatedData.vehicleInfo,
        serviceDescription: validatedData.serviceDescription,
        preferredDate: new Date(validatedData.preferredDate),
        status: "pre_agendamento",
      });
      
      // Send notification to admins via email
      const admins = await storage.getAllUsers();
      const adminEmails = admins.filter(u => u.username.includes('@')).map(u => u.username);
      
      sendAppointmentRequestNotification(adminEmails, {
        customerName,
        customerPhone,
        customerEmail,
        vehicleInfo: validatedData.vehicleInfo,
        serviceDescription: validatedData.serviceDescription,
        preferredDate: new Date(validatedData.preferredDate)
      }).catch(err => console.error('Email notification failed:', err));
      
      // Get WhatsApp number from settings for WhatsApp notification
      const settings = await storage.getSiteSettings();
      const whatsappNumber = settings?.whatsappNumber || "";
      
      res.status(201).json({ 
        appointment, 
        whatsappNumber,
        message: "Pré-agendamento enviado com sucesso! Entraremos em contato para confirmar após análise do veículo." 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message || "Dados inválidos" });
      }
      console.error("Error creating appointment:", error);
      res.status(500).json({ error: "Failed to create appointment" });
    }
  });

  app.patch("/api/appointments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid appointment ID" });
      }
      
      const existingAppointment = await storage.getAppointment(id);
      if (!existingAppointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      const validatedData = updateAppointmentSchema.parse(req.body);
      
      const updateData: any = { ...validatedData };
      if (validatedData.confirmedDate) {
        updateData.confirmedDate = new Date(validatedData.confirmedDate);
      }
      
      const appointment = await storage.updateAppointment(id, updateData);
      
      // If status changed and customer has email, send notification
      if (validatedData.status && existingAppointment.customerEmail) {
        sendAppointmentStatusUpdateNotification(existingAppointment.customerEmail, {
          customerName: existingAppointment.customerName,
          vehicleInfo: existingAppointment.vehicleInfo,
          newStatus: validatedData.status,
          confirmedDate: updateData.confirmedDate || appointment?.confirmedDate,
          adminNotes: validatedData.adminNotes ?? existingAppointment.adminNotes,
          estimatedPrice: validatedData.estimatedPrice ?? existingAppointment.estimatedPrice
        }).catch(err => console.error('Status notification failed:', err));
      }
      
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message || "Dados inválidos" });
      }
      console.error("Error updating appointment:", error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid appointment ID" });
      }
      const deleted = await storage.deleteAppointment(id);
      if (!deleted) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  // Customer-specific appointment route
  app.get("/api/customer/appointments", requireCustomerAuth, async (req, res) => {
    try {
      const customerId = req.session.customerId!;
      const appointments = await storage.getAppointmentsByCustomer(customerId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching customer appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  // Offered Services routes
  app.get("/api/offered-services", async (req, res) => {
    try {
      const services = await storage.getActiveOfferedServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching offered services:", error);
      res.status(500).json({ error: "Failed to fetch offered services" });
    }
  });

  app.get("/api/offered-services/all", requireAuth, async (req, res) => {
    try {
      const services = await storage.getAllOfferedServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching all offered services:", error);
      res.status(500).json({ error: "Failed to fetch offered services" });
    }
  });

  app.get("/api/offered-services/:id", async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid service ID" });
      }
      const service = await storage.getOfferedService(id);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error fetching offered service:", error);
      res.status(500).json({ error: "Failed to fetch offered service" });
    }
  });

  app.post("/api/offered-services", requireAuth, async (req, res) => {
    try {
      const validatedData = insertOfferedServiceSchema.parse(req.body);
      const service = await storage.createOfferedService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating offered service:", error);
      res.status(500).json({ error: "Failed to create offered service" });
    }
  });

  app.patch("/api/offered-services/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid service ID" });
      }
      const validatedData = updateOfferedServiceSchema.parse(req.body);
      const service = await storage.updateOfferedService(id, validatedData);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating offered service:", error);
      res.status(500).json({ error: "Failed to update offered service" });
    }
  });

  app.delete("/api/offered-services/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid service ID" });
      }
      const success = await storage.deleteOfferedService(id);
      if (!success) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting offered service:", error);
      res.status(500).json({ error: "Failed to delete offered service" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, validatedData);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const deleted = await storage.deleteProduct(id);
      if (!deleted) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // ===== SITE SETTINGS ROUTES =====
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", requireAuth, async (req, res) => {
    try {
      const validatedData = updateSiteSettingsSchema.parse(req.body);
      const settings = await storage.updateSiteSettings(validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // ===== CUSTOMER AUTH ROUTES =====
  app.post("/api/customer/register", async (req, res) => {
    try {
      const validatedData = registerCustomerSchema.parse(req.body);
      
      const existingCustomer = await storage.getCustomerByEmail(validatedData.email);
      if (existingCustomer && existingCustomer.isRegistered) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      const hashedPassword = await hashPassword(validatedData.password);
      
      let customer;
      if (existingCustomer) {
        customer = await storage.updateCustomer(existingCustomer.id, {
          ...validatedData,
          password: hashedPassword,
          isRegistered: true,
        });
      } else {
        customer = await storage.createCustomer({
          ...validatedData,
          password: hashedPassword,
          isRegistered: true,
        });
      }

      // Send email notification to admins
      const admins = await storage.getAllUsers();
      const adminEmails = admins
        .filter(u => u.username.includes('@'))
        .map(u => u.username);
      
      sendNewCustomerNotification(adminEmails, {
        name: customer!.name,
        email: customer!.email,
        phone: customer!.phone
      }).catch(err => console.error('Email notification failed:', err));

      req.session.customerId = customer!.id;
      res.status(201).json({ id: customer!.id, name: customer!.name, email: customer!.email });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error registering customer:", error);
      res.status(500).json({ error: "Failed to register" });
    }
  });

  app.post("/api/customer/login", async (req, res) => {
    try {
      const validatedData = customerLoginSchema.parse(req.body);
      
      const customer = await storage.getCustomerByEmail(validatedData.email);
      if (!customer || !customer.isRegistered || !customer.password) {
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }

      const isValid = await comparePasswords(validatedData.password, customer.password);
      if (!isValid) {
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }

      req.session.customerId = customer.id;
      res.json({ id: customer.id, name: customer.name, email: customer.email });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error logging in customer:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/customer/logout", (req, res) => {
    req.session.customerId = undefined;
    res.json({ success: true });
  });

  app.get("/api/customer/me", async (req, res) => {
    if (!req.session.customerId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const customer = await storage.getCustomer(req.session.customerId);
      if (!customer) {
        req.session.customerId = undefined;
        return res.status(401).json({ error: "Customer not found" });
      }
      res.json({ 
        id: customer.id, 
        name: customer.name, 
        email: customer.email, 
        phone: customer.phone,
        nickname: customer.nickname,
        deliveryAddress: customer.deliveryAddress 
      });
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.patch("/api/customer/me", requireCustomerAuth, async (req, res) => {
    try {
      const { name, phone, nickname, deliveryAddress } = req.body;
      const customer = await storage.updateCustomer(req.session.customerId!, {
        name, phone, nickname, deliveryAddress
      });
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  // ===== CHECKOUT ROUTE =====
  app.post("/api/checkout", async (req, res) => {
    try {
      const validatedData = checkoutSchema.parse(req.body);
      const { customer: customerData, items, total } = validatedData;

      let customer = await storage.getCustomerByPhone(customerData.phone);
      if (!customer) {
        if (customerData.email) {
          customer = await storage.getCustomerByEmail(customerData.email);
        }
      }

      if (!customer) {
        customer = await storage.createCustomer({
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email || null,
          nickname: customerData.nickname || null,
          deliveryAddress: customerData.deliveryAddress || null,
          isRegistered: false,
        });
      } else {
        await storage.updateCustomer(customer.id, {
          name: customerData.name,
          deliveryAddress: customerData.deliveryAddress || customer.deliveryAddress,
        });
      }

      const itemsList = items.map(item => 
        `• ${item.quantity}x ${item.productName} - R$ ${(item.productPrice * item.quantity).toFixed(2)}`
      ).join("\n");

      const whatsappMessage = `🏍️ *Novo Pedido*\n\n` +
        `*Cliente:* ${customerData.name}\n` +
        `*Telefone:* ${customerData.phone}\n` +
        (customerData.email ? `*Email:* ${customerData.email}\n` : "") +
        (customerData.deliveryAddress ? `*Endereço:* ${customerData.deliveryAddress}\n` : "") +
        `\n*Itens:*\n${itemsList}\n\n` +
        `*Total: R$ ${total.toFixed(2)}*`;

      const order = await storage.createOrder({
        customerId: customer.id,
        status: "pending",
        total,
        customerName: customerData.name,
        customerPhone: customerData.phone,
        customerEmail: customerData.email || null,
        deliveryAddress: customerData.deliveryAddress || null,
        whatsappMessage,
      });

      for (const item of items) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          productPrice: item.productPrice,
          quantity: item.quantity,
        });
      }

      res.status(201).json({ 
        orderId: order.id, 
        whatsappMessage,
        customerId: customer.id 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error processing checkout:", error);
      res.status(500).json({ error: "Failed to process checkout" });
    }
  });

  // ===== ORDER ROUTES =====
  app.get("/api/customer/orders", requireCustomerAuth, async (req, res) => {
    try {
      const orders = await storage.getOrdersByCustomer(req.session.customerId!);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/customer/orders/:id", requireCustomerAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id as string);
      const order = await storage.getOrder(orderId);
      
      if (!order || order.customerId !== req.session.customerId) {
        return res.status(404).json({ error: "Order not found" });
      }

      const items = await storage.getOrderItems(orderId);
      res.json({ ...order, items });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  // Admin orders view
  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id as string);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const items = await storage.getOrderItems(orderId);
      res.json({ ...order, items });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.patch("/api/orders/:id/status", requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id as string);
      const { status } = req.body;
      
      const order = await storage.updateOrderStatus(orderId, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // ===== ADMIN CUSTOMER MANAGEMENT =====
  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id as string);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const validatedData = adminCreateCustomerSchema.parse(req.body);
      
      if (validatedData.email) {
        const existingEmail = await storage.getCustomerByEmail(validatedData.email);
        if (existingEmail) {
          return res.status(400).json({ error: "Email já cadastrado" });
        }
      }

      const existingPhone = await storage.getCustomerByPhone(validatedData.phone);
      if (existingPhone) {
        return res.status(400).json({ error: "Telefone já cadastrado" });
      }

      const customerData: any = {
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email || null,
        nickname: validatedData.nickname || null,
        deliveryAddress: validatedData.deliveryAddress || null,
        isRegistered: !!validatedData.password,
      };

      if (validatedData.password) {
        customerData.password = await hashPassword(validatedData.password);
      }

      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message || "Dados inválidos" });
      }
      console.error("Error creating customer:", error);
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  app.patch("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = adminUpdateCustomerSchema.parse(req.body);
      const customerId = req.params.id as string;
      
      const existingCustomer = await storage.getCustomer(customerId);
      if (!existingCustomer) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }

      if (validatedData.email && validatedData.email !== existingCustomer.email) {
        const existingEmail = await storage.getCustomerByEmail(validatedData.email);
        if (existingEmail && existingEmail.id !== customerId) {
          return res.status(400).json({ error: "Email já cadastrado por outro cliente" });
        }
      }

      if (validatedData.phone && validatedData.phone !== existingCustomer.phone) {
        const existingPhone = await storage.getCustomerByPhone(validatedData.phone);
        if (existingPhone && existingPhone.id !== customerId) {
          return res.status(400).json({ error: "Telefone já cadastrado por outro cliente" });
        }
      }
      
      const customer = await storage.updateCustomer(customerId, {
        name: validatedData.name,
        email: validatedData.email === "" ? null : validatedData.email,
        phone: validatedData.phone,
        nickname: validatedData.nickname,
        deliveryAddress: validatedData.deliveryAddress,
      });
      
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message || "Dados inválidos" });
      }
      console.error("Error updating customer:", error);
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteCustomer(req.params.id as string);
      if (!success) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  // Admin User Management Routes
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const validatedData = adminCreateUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Nome de usuário já existe" });
      }

      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        username: validatedData.username,
        password: hashedPassword,
        role: validatedData.role || "admin",
      });

      const { password, ...sanitizedUser } = user;
      res.status(201).json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message || "Dados inválidos" });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const validatedData = adminUpdateUserSchema.parse(req.body);
      const userId = req.params.id as string;
      
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      if (req.session.userId === userId && validatedData.role && validatedData.role !== "admin") {
        return res.status(400).json({ error: "Você não pode rebaixar seu próprio perfil" });
      }

      if (validatedData.username && validatedData.username !== existingUser.username) {
        const userWithUsername = await storage.getUserByUsername(validatedData.username);
        if (userWithUsername) {
          return res.status(400).json({ error: "Nome de usuário já existe" });
        }
      }

      const updateData: any = {};
      if (validatedData.username) updateData.username = validatedData.username;
      if (validatedData.role) updateData.role = validatedData.role;
      if (validatedData.password) {
        updateData.password = await hashPassword(validatedData.password);
      }

      const updatedUser = await storage.updateUser(userId, updateData);
      if (updatedUser) {
        const { password, ...sanitizedUser } = updatedUser;
        res.json(sanitizedUser);
      } else {
        res.status(404).json({ error: "Usuário não encontrado" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message || "Dados inválidos" });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id as string;
      
      if (req.session.userId === userId) {
        return res.status(400).json({ error: "Você não pode excluir sua própria conta" });
      }

      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // ===== REVIEWS ROUTES =====
  app.get("/api/products/:id/reviews", async (req, res) => {
    try {
      const productId = parseInt(String(req.params.id));
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const productReviews = await storage.getReviewsByProduct(productId);
      const avgRating = await storage.getProductAverageRating(productId);
      res.json({ reviews: productReviews, avgRating });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.post("/api/products/:id/reviews", requireCustomerAuth, async (req, res) => {
    try {
      const productId = parseInt(String(req.params.id));
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const validatedData = createReviewSchema.parse({ ...req.body, productId });
      const customerId = req.session.customerId!;
      const customer = await storage.getCustomer(customerId);
      
      const review = await storage.createReview({
        productId,
        customerId,
        customerName: customer?.name || "Cliente",
        rating: validatedData.rating,
        comment: validatedData.comment || null,
      });
      
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  registerObjectStorageRoutes(app);

  return httpServer;
}
