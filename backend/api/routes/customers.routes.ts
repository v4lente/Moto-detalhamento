import type { Express } from "express";
import { z } from "zod";
import { storage } from "../../infrastructure/storage";
import { adminCustomerCreateSchema, adminCustomerUpdateSchema } from "@shared/contracts/validation";
import { requireAuth } from "../middleware/auth";
import { createAdminCustomer, CustomerIdentityConflictError, updateAdminCustomer } from "../../services/customer-profile.service";
import { toSafeCustomerProfile } from "../../services/customer-identity.service";

/**
 * Admin customer management routes
 */
export function registerCustomersRoutes(app: Express) {
  // Get all customers
  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers.map(toSafeCustomerProfile));
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  // Get single customer
  app.get("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id as string);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(toSafeCustomerProfile(customer));
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  // Create customer
  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      adminCustomerCreateSchema.parse(req.body);
      const customer = await createAdminCustomer(req.body);
      res.status(201).json(toSafeCustomerProfile(customer));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message || "Dados inválidos" });
      }
      if (error instanceof CustomerIdentityConflictError) {
        return res.status(409).json({ error: { code: "CONFLICT", message: error.message } });
      }
      console.error("Error creating customer:", error);
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  // Update customer
  app.patch("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const customerId = req.params.id as string;
      adminCustomerUpdateSchema.parse(req.body);
      const customer = await updateAdminCustomer(customerId, req.body);
      res.json(toSafeCustomerProfile(customer));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message || "Dados inválidos" });
      }
      if (error instanceof CustomerIdentityConflictError) {
        return res.status(409).json({ error: { code: "CONFLICT", message: error.message } });
      }
      if (error instanceof Error && error.message === "CUSTOMER_NOT_FOUND") {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
      console.error("Error updating customer:", error);
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  // Delete customer
  app.delete("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteCustomer(req.params.id as string);
      if (!success) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });
}
