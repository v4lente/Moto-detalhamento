import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, updateSiteSettingsSchema, insertUserSchema, checkoutSchema, registerCustomerSchema, customerLoginSchema } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

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

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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

  return httpServer;
}
