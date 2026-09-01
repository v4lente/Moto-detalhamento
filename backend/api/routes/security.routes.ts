import type { Express } from "express";
import { issueCsrfToken } from "../middleware/csrf";

export function registerSecurityRoutes(app: Express) {
  app.get("/api/security/csrf", (req, res) => {
    res.set("Cache-Control", "no-store");
    res.json({ token: issueCsrfToken(req) });
  });
}
