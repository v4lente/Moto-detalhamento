import type { Express } from "express";
import { z } from "zod";
import { storage } from "../../infrastructure/storage";
import { insertOfferedServiceSchema, updateOfferedServiceSchema } from "@shared/schema";
import { requireAuth } from "../middleware/auth";

/**
 * Services routes including offered services and service posts
 */
export function registerServicesRoutes(app: Express) {
  // ===== SERVICE POSTS ROUTES =====
  
  app.get("/api/service-posts", async (req, res) => {
    try {
      const posts = await storage.getAllServicePosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching service posts:", error);
      res.status(500).json({ error: "Failed to fetch service posts" });
    }
  });

  app.get("/api/service-posts/featured", async (req, res) => {
    try {
      const limit = parseInt(String(req.query.limit)) || 8;
      const posts = await storage.getFeaturedServicePosts(limit);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching featured service posts:", error);
      res.status(500).json({ error: "Failed to fetch service posts" });
    }
  });

  app.get("/api/service-posts/:id", async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid service post ID" });
      }
      const post = await storage.getServicePost(id);
      if (!post) {
        return res.status(404).json({ error: "Service post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching service post:", error);
      res.status(500).json({ error: "Failed to fetch service post" });
    }
  });

  app.post("/api/service-posts", requireAuth, async (req, res) => {
    try {
      const post = await storage.createServicePost(req.body);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating service post:", error);
      res.status(500).json({ error: "Failed to create service post" });
    }
  });

  app.patch("/api/service-posts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid service post ID" });
      }
      const post = await storage.updateServicePost(id, req.body);
      if (!post) {
        return res.status(404).json({ error: "Service post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error updating service post:", error);
      res.status(500).json({ error: "Failed to update service post" });
    }
  });

  app.delete("/api/service-posts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid service post ID" });
      }
      const deleted = await storage.deleteServicePost(id);
      if (!deleted) {
        return res.status(404).json({ error: "Service post not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting service post:", error);
      res.status(500).json({ error: "Failed to delete service post" });
    }
  });

  // ===== OFFERED SERVICES ROUTES =====
  
  // Public - get active services
  app.get("/api/offered-services", async (req, res) => {
    try {
      const services = await storage.getActiveOfferedServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching offered services:", error);
      res.status(500).json({ error: "Failed to fetch offered services" });
    }
  });

  // Admin - get all services (including inactive)
  app.get("/api/offered-services/all", requireAuth, async (req, res) => {
    try {
      const services = await storage.getAllOfferedServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching all offered services:", error);
      res.status(500).json({ error: "Failed to fetch offered services" });
    }
  });

  app.get("/api/offered-services/:id", async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid service ID" });
      }
      const service = await storage.getOfferedService(id);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error fetching offered service:", error);
      res.status(500).json({ error: "Failed to fetch offered service" });
    }
  });

  app.post("/api/offered-services", requireAuth, async (req, res) => {
    try {
      const validatedData = insertOfferedServiceSchema.parse(req.body);
      const service = await storage.createOfferedService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating offered service:", error);
      res.status(500).json({ error: "Failed to create offered service" });
    }
  });

  app.patch("/api/offered-services/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid service ID" });
      }
      const validatedData = updateOfferedServiceSchema.parse(req.body);
      const service = await storage.updateOfferedService(id, validatedData);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating offered service:", error);
      res.status(500).json({ error: "Failed to update offered service" });
    }
  });

  app.delete("/api/offered-services/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid service ID" });
      }
      const success = await storage.deleteOfferedService(id);
      if (!success) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting offered service:", error);
      res.status(500).json({ error: "Failed to delete offered service" });
    }
  });
}
