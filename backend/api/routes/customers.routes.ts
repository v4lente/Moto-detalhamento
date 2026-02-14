import type { Express } from "express";
import { z } from "zod";
import { storage } from "../../infrastructure/storage";
import { adminCreateCustomerSchema, adminUpdateCustomerSchema } from "@shared/schema";
import { hashPassword } from "../../services/auth.service";
import { requireAuth } from "../middleware/auth";

/**
 * Admin customer management routes
 */
export function registerCustomersRoutes(app: Express) {
  // Get all customers
  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
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
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  // Create customer
  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const validatedData = adminCreateCustomerSchema.parse(req.body);
      
      if (validatedData.email) {
        const existingEmail = await storage.getCustomerByEmail(validatedData.email);
        if (existingEmail) {
          return res.status(400).json({ error: "Email já cadastrado" });
        }
      }

      const existingPhone = await storage.getCustomerByPhone(validatedData.phone);
      if (existingPhone) {
        return res.status(400).json({ error: "Telefone já cadastrado" });
      }

      const customerData: any = {
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email || null,
        nickname: validatedData.nickname || null,
        deliveryAddress: validatedData.deliveryAddress || null,
        isRegistered: !!validatedData.password,
      };

      if (validatedData.password) {
        customerData.password = await hashPassword(validatedData.password);
      }

      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message || "Dados inválidos" });
      }
      console.error("Error creating customer:", error);
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  // Update customer
  app.patch("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = adminUpdateCustomerSchema.parse(req.body);
      const customerId = req.params.id as string;
      
      const existingCustomer = await storage.getCustomer(customerId);
      if (!existingCustomer) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }

      if (validatedData.email && validatedData.email !== existingCustomer.email) {
        const existingEmail = await storage.getCustomerByEmail(validatedData.email);
        if (existingEmail && existingEmail.id !== customerId) {
          return res.status(400).json({ error: "Email já cadastrado por outro cliente" });
        }
      }

      if (validatedData.phone && validatedData.phone !== existingCustomer.phone) {
        const existingPhone = await storage.getCustomerByPhone(validatedData.phone);
        if (existingPhone && existingPhone.id !== customerId) {
          return res.status(400).json({ error: "Telefone já cadastrado por outro cliente" });
        }
      }
      
      const customer = await storage.updateCustomer(customerId, {
        name: validatedData.name,
        email: validatedData.email === "" ? null : validatedData.email,
        phone: validatedData.phone,
        nickname: validatedData.nickname,
        deliveryAddress: validatedData.deliveryAddress,
      });
      
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message || "Dados inválidos" });
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
