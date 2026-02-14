import type { Express } from "express";
import { z } from "zod";
import { storage } from "../../infrastructure/storage";
import { insertProductSchema, insertProductVariationSchema, createReviewSchema } from "@shared/schema";
import { requireAuth, requireCustomerAuth } from "../middleware/auth";

/**
 * Product routes including CRUD, variations, and reviews
 */
export function registerProductsRoutes(app: Express) {
  // ===== PRODUCTS CRUD =====
  
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products-with-stats", async (req, res) => {
    try {
      const products = await storage.getProductsWithStats();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products with stats:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/recent-reviews", async (req, res) => {
    try {
      const limit = parseInt(String(req.query.limit)) || 6;
      const reviews = await storage.getRecentReviews(limit);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching recent reviews:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, validatedData);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const deleted = await storage.deleteProduct(id);
      if (!deleted) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // ===== PRODUCT VARIATIONS =====
  
  app.get("/api/products/:id/variations", async (req, res) => {
    try {
      const productId = parseInt(req.params.id as string);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const variations = await storage.getVariationsByProduct(productId);
      res.json(variations);
    } catch (error) {
      console.error("Error fetching variations:", error);
      res.status(500).json({ error: "Failed to fetch variations" });
    }
  });

  app.post("/api/products/:id/variations", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id as string);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const validatedData = insertProductVariationSchema.parse({ ...req.body, productId });
      const variation = await storage.createVariation(validatedData);
      res.status(201).json(variation);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating variation:", error);
      res.status(500).json({ error: "Failed to create variation" });
    }
  });

  app.patch("/api/variations/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid variation ID" });
      }
      const updated = await storage.updateVariation(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Variation not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating variation:", error);
      res.status(500).json({ error: "Failed to update variation" });
    }
  });

  app.delete("/api/variations/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid variation ID" });
      }
      const deleted = await storage.deleteVariation(id);
      if (!deleted) {
        return res.status(404).json({ error: "Variation not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting variation:", error);
      res.status(500).json({ error: "Failed to delete variation" });
    }
  });

  // ===== REVIEWS =====
  
  app.get("/api/products/:id/reviews", async (req, res) => {
    try {
      const productId = parseInt(String(req.params.id));
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      const productReviews = await storage.getReviewsByProduct(productId);
      const avgRating = await storage.getProductAverageRating(productId);
      res.json({ reviews: productReviews, avgRating });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.post("/api/products/:id/reviews", requireCustomerAuth, async (req, res) => {
    try {
      const productId = parseInt(String(req.params.id));
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }
      
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const validatedData = createReviewSchema.parse({ ...req.body, productId });
      const customerId = req.session.customerId!;
      const customer = await storage.getCustomer(customerId);
      
      const review = await storage.createReview({
        productId,
        customerId,
        customerName: customer?.name || "Cliente",
        rating: validatedData.rating,
        comment: validatedData.comment || null,
      });
      
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });
}
