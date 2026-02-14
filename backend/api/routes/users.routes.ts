import type { Express } from "express";
import { z } from "zod";
import { storage } from "../../infrastructure/storage";
import { adminCreateUserSchema, adminUpdateUserSchema } from "@shared/schema";
import { hashPassword } from "../../services/auth.service";
import { requireAdmin } from "../middleware/auth";

/**
 * Admin user management routes
 */
export function registerUsersRoutes(app: Express) {
  // Get all users
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const sanitizedUsers = users.map(({ password, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Create user
  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const validatedData = adminCreateUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Nome de usuário já existe" });
      }

      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        username: validatedData.username,
        password: hashedPassword,
        role: validatedData.role || "admin",
      });

      const { password, ...sanitizedUser } = user;
      res.status(201).json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message || "Dados inválidos" });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Update user
  app.patch("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const validatedData = adminUpdateUserSchema.parse(req.body);
      const userId = req.params.id as string;
      
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      if (req.session.userId === userId && validatedData.role && validatedData.role !== "admin") {
        return res.status(400).json({ error: "Você não pode rebaixar seu próprio perfil" });
      }

      if (validatedData.username && validatedData.username !== existingUser.username) {
        const userWithUsername = await storage.getUserByUsername(validatedData.username);
        if (userWithUsername) {
          return res.status(400).json({ error: "Nome de usuário já existe" });
        }
      }

      const updateData: any = {};
      if (validatedData.username) updateData.username = validatedData.username;
      if (validatedData.role) updateData.role = validatedData.role;
      if (validatedData.password) {
        updateData.password = await hashPassword(validatedData.password);
      }

      const updatedUser = await storage.updateUser(userId, updateData);
      if (updatedUser) {
        const { password, ...sanitizedUser } = updatedUser;
        res.json(sanitizedUser);
      } else {
        res.status(404).json({ error: "Usuário não encontrado" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message || "Dados inválidos" });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Delete user
  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id as string;
      
      if (req.session.userId === userId) {
        return res.status(400).json({ error: "Você não pode excluir sua própria conta" });
      }

      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
}
