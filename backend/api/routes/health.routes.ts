import type { Express } from "express";
import { storage } from "../../infrastructure/storage";

/**
 * Health check routes
 */
export function registerHealthRoutes(app: Express) {
  app.get("/api/health", async (req, res) => {
    try {
      // Verifica conexao com o banco fazendo uma query simples
      const settings = await storage.getSiteSettings();
      res.json({ 
        status: "healthy", 
        timestamp: new Date().toISOString(),
        database: settings ? "connected" : "no_data"
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(503).json({ 
        status: "unhealthy", 
        timestamp: new Date().toISOString(),
        error: "Database connection failed"
      });
    }
  });
}
