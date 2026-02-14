import type { Express } from "express";
import { z } from "zod";
import { storage } from "../../infrastructure/storage";
import { insertUserSchema, registerCustomerSchema, customerLoginSchema } from "@shared/schema";
import { hashPassword, comparePasswords, shouldRehashPassword } from "../../services/auth.service";
import { sendNewCustomerNotification } from "../../infrastructure/email/resend.service";
import { requireAuth, requireAdmin, requireCustomerAuth, authLimiter } from "../middleware/auth";

/**
 * Authentication routes for Admin and Customer
 */
export function registerAuthRoutes(app: Express) {
  // ===== ADMIN AUTH ROUTES =====
  
  // Admin registration - protected route (only existing admins can create new admins)
  app.post("/api/auth/register", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const existing = await storage.getUserByUsername(validatedData.username);
      if (existing) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({ ...validatedData, password: hashedPassword });
      // Don't auto-login the new user - the admin who created them stays logged in
      res.status(201).json({ id: user.id, username: user.username });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error registering user:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Opportunistic migration for legacy or malformed stored hashes.
      if (shouldRehashPassword(user.password)) {
        const newHash = await hashPassword(password);
        await storage.updateUser(user.id, { password: newHash });
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

  app.post("/api/customer/login", authLimiter, async (req, res) => {
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

      // Opportunistic migration for legacy or malformed stored hashes.
      if (shouldRehashPassword(customer.password)) {
        const newHash = await hashPassword(validatedData.password);
        await storage.updateCustomer(customer.id, { password: newHash });
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
}
