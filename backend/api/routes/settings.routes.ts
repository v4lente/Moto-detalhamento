import type { Express } from "express";
import { z } from "zod";
import { storage } from "../../infrastructure/storage";
import { updateSiteSettingsSchema } from "@shared/schema";
import { requireAuth } from "../middleware/auth";

/**
 * Site settings routes
 */
export function registerSettingsRoutes(app: Express) {
  // Get settings (public)
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update settings (admin only)
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
}
