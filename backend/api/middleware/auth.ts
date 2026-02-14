import type { Request, Response, NextFunction } from "express";
import { storage } from "../../infrastructure/storage";
import rateLimit from "express-rate-limit";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    customerId?: string;
  }
}

/**
 * Middleware that requires admin user authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

/**
 * Middleware that requires admin role
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Acesso negado. Permissão de admin necessária." });
  }
  next();
}

/**
 * Middleware that requires customer authentication
 */
export function requireCustomerAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.customerId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

/**
 * Rate limiter for authentication routes (login, etc.)
 * 10 attempts per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: "Muitas tentativas. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General rate limiter for API routes
 * 100 requests per minute
 */
export const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: "Muitas requisições. Tente novamente em breve." },
  standardHeaders: true,
  legacyHeaders: false,
});
