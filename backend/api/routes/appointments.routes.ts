import type { Express } from "express";
import { z } from "zod";
import { storage } from "../../infrastructure/storage";
import { createAppointmentSchema, updateAppointmentSchema } from "@shared/schema";
import { sendAppointmentRequestNotification, sendAppointmentStatusUpdateNotification } from "../../infrastructure/email/resend.service";
import { requireAuth, requireCustomerAuth } from "../middleware/auth";

/**
 * Appointment routes
 */
export function registerAppointmentsRoutes(app: Express) {
  // Get all appointments (admin)
  app.get("/api/appointments", requireAuth, async (req, res) => {
    try {
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  // Get single appointment (admin)
  app.get("/api/appointments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid appointment ID" });
      }
      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      console.error("Error fetching appointment:", error);
      res.status(500).json({ error: "Failed to fetch appointment" });
    }
  });

  // Create appointment (public - for customers)
  app.post("/api/appointments", async (req, res) => {
    try {
      const validatedData = createAppointmentSchema.parse(req.body);
      
      let customerId: string | null = null;
      let customerName = validatedData.customerName || "";
      let customerPhone = validatedData.customerPhone || "";
      let customerEmail = validatedData.customerEmail || null;
      
      // Check if logged in customer
      if (req.session.customerId) {
        const customer = await storage.getCustomer(req.session.customerId);
        if (customer) {
          customerId = customer.id;
          customerName = customer.name;
          customerPhone = customer.phone;
          customerEmail = customer.email;
        }
      }
      
      if (!customerName || !customerPhone) {
        return res.status(400).json({ error: "Nome e telefone são obrigatórios" });
      }
      
      const appointment = await storage.createAppointment({
        customerId,
        customerName,
        customerPhone,
        customerEmail,
        vehicleInfo: validatedData.vehicleInfo,
        serviceDescription: validatedData.serviceDescription,
        preferredDate: new Date(validatedData.preferredDate),
        status: "pre_agendamento",
      });
      
      // Send notification to admins via email
      const admins = await storage.getAllUsers();
      const adminEmails = admins.filter(u => u.username.includes('@')).map(u => u.username);
      
      sendAppointmentRequestNotification(adminEmails, {
        customerName,
        customerPhone,
        customerEmail,
        vehicleInfo: validatedData.vehicleInfo,
        serviceDescription: validatedData.serviceDescription,
        preferredDate: new Date(validatedData.preferredDate)
      }).catch(err => console.error('Email notification failed:', err));
      
      // Get WhatsApp number from settings for WhatsApp notification
      const settings = await storage.getSiteSettings();
      const whatsappNumber = settings?.whatsappNumber || "";
      
      res.status(201).json({ 
        appointment, 
        whatsappNumber,
        message: "Pré-agendamento enviado com sucesso! Entraremos em contato para confirmar após análise do veículo." 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message || "Dados inválidos" });
      }
      console.error("Error creating appointment:", error);
      res.status(500).json({ error: "Failed to create appointment" });
    }
  });

  // Update appointment (admin)
  app.patch("/api/appointments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid appointment ID" });
      }
      
      const existingAppointment = await storage.getAppointment(id);
      if (!existingAppointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      const validatedData = updateAppointmentSchema.parse(req.body);
      
      const updateData: any = { ...validatedData };
      if (validatedData.confirmedDate) {
        updateData.confirmedDate = new Date(validatedData.confirmedDate);
      }
      
      const appointment = await storage.updateAppointment(id, updateData);
      
      // If status changed and customer has email, send notification
      if (validatedData.status && existingAppointment.customerEmail) {
        sendAppointmentStatusUpdateNotification(existingAppointment.customerEmail, {
          customerName: existingAppointment.customerName,
          vehicleInfo: existingAppointment.vehicleInfo,
          newStatus: validatedData.status,
          confirmedDate: updateData.confirmedDate || appointment?.confirmedDate,
          adminNotes: validatedData.adminNotes ?? existingAppointment.adminNotes,
          estimatedPrice: validatedData.estimatedPrice ?? existingAppointment.estimatedPrice
        }).catch(err => console.error('Status notification failed:', err));
      }
      
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message || "Dados inválidos" });
      }
      console.error("Error updating appointment:", error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  // Delete appointment (admin)
  app.delete("/api/appointments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid appointment ID" });
      }
      const deleted = await storage.deleteAppointment(id);
      if (!deleted) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  // Customer-specific appointment route
  app.get("/api/customer/appointments", requireCustomerAuth, async (req, res) => {
    try {
      const customerId = req.session.customerId!;
      const appointments = await storage.getAppointmentsByCustomer(customerId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching customer appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });
}
