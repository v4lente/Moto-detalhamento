import type { Express } from "express";
import { isDatabaseAvailable, databaseError } from "../../infrastructure/db";
import { storage } from "../../infrastructure/storage";

/**
 * Health check routes
 */
export function registerHealthRoutes(app: Express) {
  app.get("/api/health", async (req, res) => {
    if (!isDatabaseAvailable) {
      return res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: databaseError ?? "Database not configured",
      });
    }

    try {
      const settings = await storage.getSiteSettings();
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: settings ? "connected" : "no_data",
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Database connection failed",
      });
    }
  });
}
