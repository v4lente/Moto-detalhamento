import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

const TOKEN_KEY = "csrfToken" as const;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_RETRY_HEADER = "X-CSRF-Retry";

export function issueCsrfToken(req: Request): string {
  if (!req.session[TOKEN_KEY]) req.session[TOKEN_KEY] = randomBytes(32).toString("base64url");
  return req.session[TOKEN_KEY] as string;
}

function validOrigin(req: Request): boolean {
  const origin = req.get("origin");
  const referer = req.get("referer");
  if (!origin && !referer) return process.env.NODE_ENV !== "production";
  const expected = `${req.protocol}://${req.get("host")}`;
  return Boolean((origin && origin === expected) || (referer && referer.startsWith(`${expected}/`)));
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const route = req.originalUrl.split("?")[0];
  if (SAFE_METHODS.has(req.method) || route === "/api/webhooks/stripe" ||
      route === "/api/customer/login" || route === "/api/customer/register" ||
      route === "/api/auth/login" || route === "/api/auth/register" || route === "/api/auth/logout" ||
      route === "/api/customer/logout") return next();
  if (!validOrigin(req)) return res.status(403).json({ error: { code: "FORBIDDEN", message: "Origem da requisição inválida" } });
  const expected = req.session[TOKEN_KEY];
  const supplied = req.get("x-csrf-token") || (typeof req.body?._csrf === "string" ? req.body._csrf : undefined);
  if (!expected || !supplied) {
    res.set(CSRF_RETRY_HEADER, "1");
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Token CSRF ausente" } });
  }
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.set(CSRF_RETRY_HEADER, "1");
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Token CSRF inválido" } });
  }
  next();
}
