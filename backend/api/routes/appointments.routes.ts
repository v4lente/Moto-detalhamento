import type { Express, Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { storage } from "../../infrastructure/storage";
import { createAppointmentSchema, updateAppointmentSchema } from "@shared/schema";
import { requireAdmin } from "../middleware/auth";
import {
  AppointmentConflictError,
  AppointmentValidationError,
  createAppointment,
  getAppointmentSummary,
  listAppointments,
  setAppointmentArchived,
  updateAppointment,
} from "../../services/appointment.service";
import {
  BUDGET_MAX_FILE_SIZE,
  generateBudgetPdf,
  readBudgetFile,
  removeBudgetFile,
  storeBudgetFile,
  validateBudgetFile,
} from "../../services/appointment-budget.service";

const budgetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: BUDGET_MAX_FILE_SIZE, files: 1 },
});

function appointmentId(req: Request): number | null {
  const id = Number.parseInt(String(req.params.id), 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

async function removeReplacedBudget(storageKey: string | null | undefined): Promise<void> {
  try {
    await removeBudgetFile(storageKey);
  } catch (error) {
    // The database already points to the new file. Keep it valid and only log
    // a possible orphaned old file for later operational cleanup.
    console.error("Failed to remove replaced appointment budget", error);
  }
}

function handleAppointmentError(error: unknown, res: Response) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ error: error.errors[0]?.message || "Dados inválidos" });
  }
  if (error instanceof AppointmentConflictError) {
    return res.status(409).json({
      error: {
        code: error.code,
        message: error.message,
        conflicts: error.conflicts.map((item) => ({
          id: item.id,
          customerName: item.customerName,
          vehicleInfo: item.vehicleInfo,
          startAt: item.startAt,
          plannedEndAt: item.plannedEndAt,
        })),
      },
    });
  }
  if (error instanceof AppointmentValidationError) {
    const status = error.message.includes("não encontrado") ? 404 : 400;
    return res.status(status).json({ error: error.message });
  }
  console.error("Appointment operation failed:", error);
  return res.status(500).json({ error: "Falha ao processar agendamento" });
}

export function registerAppointmentsRoutes(app: Express) {
  app.get("/api/appointments/summary", requireAdmin, async (_req, res) => {
    try {
      res.json(await getAppointmentSummary());
    } catch (error) {
      handleAppointmentError(error, res);
    }
  });

  app.get("/api/appointments", requireAdmin, async (req, res) => {
    try {
      res.json(await listAppointments({
        month: typeof req.query.month === "string" ? req.query.month : undefined,
        status: typeof req.query.status === "string" ? req.query.status : undefined,
        query: typeof req.query.query === "string" ? req.query.query : undefined,
        archived: typeof req.query.archived === "string" ? req.query.archived : "active",
      }));
    } catch (error) {
      handleAppointmentError(error, res);
    }
  });

  app.get("/api/appointments/:id", requireAdmin, async (req, res) => {
    const id = appointmentId(req);
    if (!id) return res.status(400).json({ error: "ID de agendamento inválido" });
    try {
      const appointment = await storage.getAppointmentWithItems(id);
      if (!appointment) return res.status(404).json({ error: "Agendamento não encontrado" });
      res.json(appointment);
    } catch (error) {
      handleAppointmentError(error, res);
    }
  });

  app.post("/api/appointments", requireAdmin, async (req, res) => {
    try {
      const data = createAppointmentSchema.parse(req.body);
      res.status(201).json(await createAppointment(data));
    } catch (error) {
      handleAppointmentError(error, res);
    }
  });

  app.patch("/api/appointments/:id", requireAdmin, async (req, res) => {
    const id = appointmentId(req);
    if (!id) return res.status(400).json({ error: "ID de agendamento inválido" });
    try {
      const data = updateAppointmentSchema.parse(req.body);
      res.json(await updateAppointment(id, data));
    } catch (error) {
      handleAppointmentError(error, res);
    }
  });

  app.post("/api/appointments/:id/archive", requireAdmin, async (req, res) => {
    const id = appointmentId(req);
    if (!id) return res.status(400).json({ error: "ID de agendamento inválido" });
    try {
      res.json(await setAppointmentArchived(id, true));
    } catch (error) {
      handleAppointmentError(error, res);
    }
  });

  app.post("/api/appointments/:id/restore", requireAdmin, async (req, res) => {
    const id = appointmentId(req);
    if (!id) return res.status(400).json({ error: "ID de agendamento inválido" });
    try {
      res.json(await setAppointmentArchived(id, false));
    } catch (error) {
      handleAppointmentError(error, res);
    }
  });

  app.post("/api/appointments/:id/budget/upload", requireAdmin, (req, res) => {
    budgetUpload.single("file")(req, res, async (uploadError) => {
      if (uploadError instanceof multer.MulterError && uploadError.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "O orçamento deve ter no máximo 10 MB" });
      }
      if (uploadError) return res.status(400).json({ error: "Falha ao receber o arquivo" });
      const id = appointmentId(req);
      if (!id) return res.status(400).json({ error: "ID de agendamento inválido" });
      if (!req.file) return res.status(400).json({ error: "Selecione um arquivo" });

      try {
        const existing = await storage.getAppointmentWithItems(id);
        if (!existing) return res.status(404).json({ error: "Agendamento não encontrado" });
        if (existing.budgetStorageKey && req.body?.replace !== "true") {
          return res.status(409).json({
            error: { code: "BUDGET_EXISTS", message: "Confirme a substituição do orçamento atual" },
          });
        }
        const validationError = validateBudgetFile(req.file.buffer, req.file.mimetype);
        if (validationError) return res.status(415).json({ error: validationError });

        const storageKey = await storeBudgetFile(req.file.buffer, req.file.mimetype);
        let updated;
        try {
          updated = await storage.updateAppointmentBundle(id, {
            budgetStorageKey: storageKey,
            budgetOriginalName: req.file.originalname.slice(0, 255),
            budgetMimeType: req.file.mimetype,
            budgetSource: "uploaded",
            budgetUpdatedAt: new Date(),
          });
        } catch (error) {
          await removeBudgetFile(storageKey);
          throw error;
        }
        await removeReplacedBudget(existing.budgetStorageKey);
        return res.json(updated);
      } catch (error) {
        return handleAppointmentError(error, res);
      }
    });
  });

  app.post("/api/appointments/:id/budget/generate", requireAdmin, async (req, res) => {
    const id = appointmentId(req);
    if (!id) return res.status(400).json({ error: "ID de agendamento inválido" });
    try {
      const existing = await storage.getAppointmentWithItems(id);
      if (!existing) return res.status(404).json({ error: "Agendamento não encontrado" });
      if (existing.budgetStorageKey && req.body?.replace !== true) {
        return res.status(409).json({
          error: { code: "BUDGET_EXISTS", message: "Confirme a substituição do orçamento atual" },
        });
      }
      const pdf = generateBudgetPdf(existing, await storage.getSiteSettings());
      const storageKey = await storeBudgetFile(pdf, "application/pdf");
      let updated;
      try {
        updated = await storage.updateAppointmentBundle(id, {
          budgetStorageKey: storageKey,
          budgetOriginalName: `ORC-${id}.pdf`,
          budgetMimeType: "application/pdf",
          budgetSource: "generated",
          budgetUpdatedAt: new Date(),
        });
      } catch (error) {
        await removeBudgetFile(storageKey);
        throw error;
      }
      await removeReplacedBudget(existing.budgetStorageKey);
      res.json(updated);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Defina ao menos")) {
        return res.status(400).json({ error: error.message });
      }
      handleAppointmentError(error, res);
    }
  });

  app.get("/api/appointments/:id/budget", requireAdmin, async (req, res) => {
    const id = appointmentId(req);
    if (!id) return res.status(400).json({ error: "ID de agendamento inválido" });
    try {
      const appointment = await storage.getAppointment(id);
      if (!appointment?.budgetStorageKey) return res.status(404).json({ error: "Orçamento não encontrado" });
      const file = await readBudgetFile(appointment.budgetStorageKey);
      const safeName = (appointment.budgetOriginalName || `ORC-${id}.pdf`).replace(/[\r\n"]/g, "_");
      res.setHeader("Content-Type", appointment.budgetMimeType || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
      res.send(file);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return res.status(404).json({ error: "Arquivo de orçamento não encontrado" });
      }
      handleAppointmentError(error, res);
    }
  });

  app.delete("/api/appointments/:id/budget", requireAdmin, async (req, res) => {
    const id = appointmentId(req);
    if (!id) return res.status(400).json({ error: "ID de agendamento inválido" });
    try {
      const existing = await storage.getAppointment(id);
      if (!existing) return res.status(404).json({ error: "Agendamento não encontrado" });
      await storage.updateAppointmentBundle(id, {
        budgetStorageKey: null,
        budgetOriginalName: null,
        budgetMimeType: null,
        budgetSource: null,
        budgetUpdatedAt: null,
      });
      await removeReplacedBudget(existing.budgetStorageKey);
      res.status(204).send();
    } catch (error) {
      handleAppointmentError(error, res);
    }
  });
}
