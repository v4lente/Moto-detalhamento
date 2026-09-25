import type { Express } from "express";
import { z } from "zod";
import { dashboardAnalyticsQuerySchema } from "@shared/contracts/validation";
import { requireAdmin } from "../middleware/auth";
import { ApiError, sendApiError } from "../lib/api-error";
import { getDashboardAnalytics } from "../../services/analytics.service";

export function registerAnalyticsRoutes(app: Express) {
  app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
    try {
      const query = dashboardAnalyticsQuerySchema.parse(req.query);
      res.set("Cache-Control", "no-store");
      res.json(await getDashboardAnalytics(query));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Período inválido", details: error.flatten() } });
      }
      if (error?.code === "DATABASE_UNAVAILABLE") {
        return sendApiError(res, new ApiError(503, "DATABASE_UNAVAILABLE", "Banco de dados indisponível"));
      }
      return sendApiError(res, error, "Falha ao carregar análises");
    }
  });
}
