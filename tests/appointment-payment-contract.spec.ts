import { expect, test } from "@playwright/test";
import fs from "node:fs";
import {
  appointmentPaymentStatusSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
} from "../shared/contracts/validation";
import { createAppointment, updateAppointment } from "../backend/services/appointment.service";
import { storage } from "../backend/infrastructure/storage";

const baseAppointment = {
  customerName: "João da Silva",
  customerPhone: "11999998888",
  vehicleInfo: "Honda CB 500F",
  startAt: "2026-09-10T12:00:00.000Z",
  items: [{
    serviceName: "Polimento",
    description: "Polimento técnico completo",
    durationMinutes: 90,
    agreedAmount: "250.50",
  }],
};

test.describe("contrato do pagamento informativo da agenda", () => {
  test("aceita somente pago e nao_pago", () => {
    expect(appointmentPaymentStatusSchema.safeParse("pago").success).toBeTruthy();
    expect(appointmentPaymentStatusSchema.safeParse("nao_pago").success).toBeTruthy();
    expect(appointmentPaymentStatusSchema.safeParse("pendente").success).toBeFalsy();
    expect(appointmentPaymentStatusSchema.safeParse(null).success).toBeFalsy();
  });

  test("aplica nao_pago por default na criação", () => {
    const result = createAppointmentSchema.safeParse(baseAppointment);
    expect(result.success).toBeTruthy();
    if (result.success) expect(result.data.paymentStatus).toBe("nao_pago");
  });

  test("permite atualização explícita e preserva omissão no contrato", () => {
    expect(updateAppointmentSchema.safeParse({ paymentStatus: "pago" }).success).toBeTruthy();
    expect(updateAppointmentSchema.safeParse({ paymentStatus: "nao_pago" }).success).toBeTruthy();
    expect(updateAppointmentSchema.safeParse({}).success).toBeTruthy();
    expect(updateAppointmentSchema.safeParse({ paymentStatus: "pendente" }).success).toBeFalsy();
    expect(updateAppointmentSchema.safeParse({ paymentStatus: null }).success).toBeFalsy();
  });

  test("expõe leitura e mutação somente nas rotas administrativas", async ({ request }) => {
    const routes = fs.readFileSync("backend/api/routes/appointments.routes.ts", "utf8");
    expect(routes).toContain('app.get("/api/appointments", requireAdmin');
    expect(routes).toContain('app.get("/api/appointments/:id", requireAdmin');
    expect(routes).toContain('app.post("/api/appointments", requireAdmin');
    expect(routes).toContain('app.patch("/api/appointments/:id", requireAdmin');

    const response = await request.get("/api/appointments");
    expect(response.status()).toBe(401);
    expect((await response.json()).error).toBeTruthy();
  });

  test("transporta o default na criação e preserva ou altera o pagamento na edição", async () => {
    const original = {
      getAllAppointmentsWithItems: storage.getAllAppointmentsWithItems,
      getAppointmentWithItems: storage.getAppointmentWithItems,
      createAppointmentBundle: storage.createAppointmentBundle,
      updateAppointmentBundle: storage.updateAppointmentBundle,
    };
    const now = new Date("2026-09-10T12:00:00.000Z");
    let current: any = {
      id: 42,
      customerId: null,
      customerName: "João da Silva",
      customerPhone: "11999998888",
      customerEmail: null,
      vehicleInfo: "Honda CB 500F",
      serviceDescription: "Polimento",
      preferredDate: now,
      confirmedDate: now,
      startAt: now,
      plannedEndAt: new Date("2026-09-10T13:30:00.000Z"),
      completedAt: null,
      status: "em_andamento",
      paymentStatus: "nao_pago",
      adminNotes: null,
      totalAmount: "250.50",
      archivedAt: null,
      budgetStorageKey: null,
      budgetOriginalName: null,
      budgetMimeType: null,
      budgetSource: null,
      budgetUpdatedAt: null,
      createdAt: now,
      updatedAt: now,
      items: [{
        id: 1,
        appointmentId: 42,
        serviceId: null,
        serviceName: "Polimento",
        description: "Polimento técnico completo",
        durationMinutes: 90,
        agreedAmount: "250.50",
        sortOrder: 0,
        createdAt: now,
      }],
    };
    let persisted: any;

    try {
      storage.getAllAppointmentsWithItems = async () => [];
      storage.getAppointmentWithItems = async () => current;
      storage.createAppointmentBundle = async (appointment, items) => {
        persisted = appointment;
        current = { ...current, ...appointment, items };
        return current;
      };
      storage.updateAppointmentBundle = async (_id, update, items) => {
        persisted = update;
        current = { ...current, ...update, items: items || current.items };
        return current;
      };

      await createAppointment({ ...baseAppointment, status: "em_andamento" });
      expect(persisted.paymentStatus).toBe("nao_pago");

      await updateAppointment(42, { adminNotes: "Pagamento a confirmar" });
      expect(persisted.paymentStatus).toBe("nao_pago");
      expect(persisted.status).toBe("em_andamento");

      await updateAppointment(42, { paymentStatus: "pago" });
      expect(persisted.paymentStatus).toBe("pago");
      expect(persisted.status).toBe("em_andamento");
    } finally {
      Object.assign(storage, original);
    }
  });
});
