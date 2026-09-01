import type { Express } from "express";
import { z } from "zod";
import { storage } from "../../infrastructure/storage";
import { insertUserSchema, customerLoginSchema } from "@shared/schema";
import { customerRegistrationSchema, customerProfileUpdateSchema } from "@shared/contracts/validation";
import { hashPassword, comparePasswords, shouldRehashPassword } from "../../services/auth.service";
import { sendNewCustomerNotification } from "../../infrastructure/email/resend.service";
import { requireAuth, requireAdmin, requireCustomerAuth, authLimiter } from "../middleware/auth";
import { registerCustomer, safeProfile, updateCustomerProfile, CustomerIdentityConflictError } from "../../services/customer-profile.service";
import { normalizeEmail } from "../../services/customer-identity.service";

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/register", requireAdmin, async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      if (await storage.getUserByUsername(data.username)) return res.status(409).json({ error: { code: "CONFLICT", message: "Username já existe" } });
      const user = await storage.createUser({ ...data, password: await hashPassword(data.password) });
      res.status(201).json({ id: user.id, username: user.username, role: user.role });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Dados inválidos", details: error.flatten() } });
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Falha ao cadastrar usuário" } });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const { username, password } = z.object({ username: z.string().min(1), password: z.string().min(1) }).parse(req.body);
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Credenciais inválidas" } });
      if (shouldRehashPassword(user.password)) await storage.updateUser(user.id, { password: await hashPassword(password) });
      await regenerateSession(req);
      req.session.userId = user.id;
      res.json({ id: user.id, username: user.username, role: user.role });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Dados inválidos" } });
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Falha ao fazer login" } });
    }
  });

  app.post("/api/auth/logout", (req, res) => destroySession(req, res));
  app.get("/api/auth/me", async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (!req.session.userId) return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Não autenticado" } });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Usuário não encontrado" } });
    res.json({ id: user.id, username: user.username, role: user.role });
  });

  app.post("/api/customer/register", async (req, res) => {
    try {
      customerRegistrationSchema.parse(req.body);
      const customer = await registerCustomer(req.body);
      const admins = await storage.getAllUsers();
      sendNewCustomerNotification(admins.filter((u) => u.username.includes("@")).map((u) => u.username), {
        name: customer.name, email: customer.email, phone: customer.phone,
      }).catch((error) => console.error("Customer notification failed", error));
      await regenerateSession(req);
      req.session.customerId = customer.id;
      res.status(201).json(safeProfile(customer));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Dados inválidos", details: error.flatten() } });
      if (error instanceof CustomerIdentityConflictError) return res.status(409).json({ error: { code: "CONFLICT", message: error.message } });
      console.error("Error registering customer", error);
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Falha ao cadastrar cliente" } });
    }
  });

  app.post("/api/customer/login", authLimiter, async (req, res) => {
    try {
      const data = customerLoginSchema.parse(req.body);
      const customer = await storage.getCustomerByEmail(normalizeEmail(data.email));
      if (!customer || !customer.isRegistered || !customer.password || !(await comparePasswords(data.password, customer.password))) {
        return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Email ou senha inválidos" } });
      }
      if (shouldRehashPassword(customer.password)) await storage.updateCustomer(customer.id, { password: await hashPassword(data.password) });
      await regenerateSession(req);
      req.session.customerId = customer.id;
      res.json(safeProfile(customer));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Dados inválidos" } });
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Falha ao fazer login" } });
    }
  });

  app.post("/api/customer/logout", (req, res) => {
    req.session.customerId = undefined;
    res.json({ success: true });
  });

  app.get("/api/customer/me", async (req, res) => {
    if (!req.session.customerId) return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Não autenticado" } });
    const customer = await storage.getCustomer(req.session.customerId);
    if (!customer) { req.session.customerId = undefined; return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Cliente não encontrado" } }); }
    res.set("Cache-Control", "no-store");
    res.json(safeProfile(customer));
  });

  app.patch("/api/customer/me", requireCustomerAuth, async (req, res) => {
    try {
      customerProfileUpdateSchema.parse(req.body);
      res.json(safeProfile(await updateCustomerProfile(req.session.customerId!, req.body)));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Dados inválidos", details: error.flatten() } });
      if (error instanceof CustomerIdentityConflictError) return res.status(409).json({ error: { code: "CONFLICT", message: error.message } });
      console.error("Error updating customer", error);
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Falha ao atualizar perfil" } });
    }
  });
}

function regenerateSession(req: any): Promise<void> {
  return new Promise((resolve, reject) => req.session.regenerate((error: Error | null) => error ? reject(error) : resolve()));
}

function destroySession(req: any, res: any) {
  req.session.destroy((error: Error | null) => {
    if (error) return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Falha ao sair" } });
    res.clearCookie("connect.sid", { path: "/", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
    res.set("Cache-Control", "no-store");
    res.json({ success: true });
  });
}
