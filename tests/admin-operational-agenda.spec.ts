import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { createAppointmentSchema, insertOfferedServiceSchema } from "../shared/contracts/validation";
import {
  AppointmentConflictError,
  appointmentIntervalsOverlap,
  calculateAppointmentPlannedEnd,
  calculateAppointmentTotal,
  createAppointment,
  setAppointmentArchived,
  updateAppointment,
} from "../backend/services/appointment.service";
import {
  BUDGET_MAX_FILE_SIZE,
  generateBudgetPdf,
  validateBudgetFile,
} from "../backend/services/appointment-budget.service";
import { resolveAppointmentBudgetsDir } from "../backend/api/lib/private-uploads-dir";
import { storage } from "../backend/infrastructure/storage";

const appointmentInput = {
  customerName: "João da Silva",
  customerPhone: "11999998888",
  vehicleInfo: "Honda CB 500F",
  startAt: "2026-09-10T12:00:00.000Z",
  items: [
    {
      serviceName: "Polimento",
      description: "Polimento técnico completo",
      durationMinutes: 90,
      agreedAmount: "250.50",
    },
  ],
};

function appointmentFixture(overrides: Record<string, unknown> = {}) {
  const now = new Date("2026-09-10T12:00:00.000Z");
  return {
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
    status: "agendado_nao_iniciado",
    adminNotes: "Cuidar do tanque",
    estimatedPrice: null,
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
    ...overrides,
  } as any;
}

test.describe("agenda operacional administrativa", () => {
  test("valida contato avulso, cliente cadastrado, itens e duração de serviço", () => {
    expect(createAppointmentSchema.safeParse(appointmentInput).success).toBeTruthy();
    expect(createAppointmentSchema.safeParse({
      ...appointmentInput,
      customerName: undefined,
      customerPhone: undefined,
      customerId: "505c0c27-b35c-4e20-9b47-951a85bb5859",
    }).success).toBeTruthy();
    expect(createAppointmentSchema.safeParse({
      ...appointmentInput,
      customerName: undefined,
      customerPhone: undefined,
    }).success).toBeFalsy();
    expect(createAppointmentSchema.safeParse({
      ...appointmentInput,
      customerPhone: "telefone qualquer",
    }).success).toBeFalsy();
    expect(createAppointmentSchema.safeParse({
      ...appointmentInput,
      customerPhone: "(11) 98888-7777",
      customerEmail: "cliente@example.com",
    }).success).toBeTruthy();
    expect(createAppointmentSchema.safeParse({
      ...appointmentInput,
      customerEmail: "email-invalido",
    }).success).toBeFalsy();
    expect(createAppointmentSchema.safeParse({
      ...appointmentInput,
      items: [{ ...appointmentInput.items[0], agreedAmount: "12.999" }],
    }).success).toBeFalsy();
    expect(insertOfferedServiceSchema.safeParse({
      name: "Lavagem",
      details: "Lavagem detalhada",
      estimatedDurationMinutes: 15,
    }).success).toBeTruthy();
    expect(insertOfferedServiceSchema.safeParse({
      name: "Lavagem",
      details: "Lavagem detalhada",
      estimatedDurationMinutes: 10,
    }).success).toBeFalsy();
    expect(insertOfferedServiceSchema.safeParse({
      name: "Lavagem",
      details: "Lavagem detalhada",
    }).success).toBeFalsy();
  });

  test("calcula total decimal, fim previsto e limites de conflito", () => {
    expect(calculateAppointmentTotal([
      { serviceName: "A", description: "Serviço A", durationMinutes: 60, agreedAmount: "100.20" },
      { serviceName: "B", description: "Serviço B", durationMinutes: 30, agreedAmount: "50.30" },
    ])).toBe("150.50");
    expect(calculateAppointmentTotal([
      { serviceName: "A", description: "Serviço A", durationMinutes: 60, agreedAmount: null },
    ])).toBeNull();

    const startAt = new Date("2026-09-10T12:00:00.000Z");
    expect(calculateAppointmentPlannedEnd(startAt, [{ durationMinutes: 60 }, { durationMinutes: 30 }]).toISOString())
      .toBe("2026-09-10T13:30:00.000Z");
    expect(appointmentIntervalsOverlap(
      { startAt, plannedEndAt: new Date("2026-09-10T13:00:00.000Z") },
      { startAt: new Date("2026-09-10T12:59:00.000Z"), plannedEndAt: new Date("2026-09-10T14:00:00.000Z") },
    )).toBeTruthy();
    expect(appointmentIntervalsOverlap(
      { startAt, plannedEndAt: new Date("2026-09-10T13:00:00.000Z") },
      { startAt: new Date("2026-09-10T13:00:00.000Z"), plannedEndAt: new Date("2026-09-10T14:00:00.000Z") },
    )).toBeFalsy();
  });

  test("orquestra múltiplos itens, conflito confirmado, conclusão e arquivamento", async () => {
    const original = {
      getOfferedService: storage.getOfferedService,
      getAllAppointmentsWithItems: storage.getAllAppointmentsWithItems,
      createAppointmentBundle: storage.createAppointmentBundle,
      getAppointmentWithItems: storage.getAppointmentWithItems,
      updateAppointmentBundle: storage.updateAppointmentBundle,
    };
    let conflicts: any[] = [];
    let storedAppointment: any;
    let storedItems: any[] = [];
    let current = appointmentFixture();

    try {
      storage.getOfferedService = async (id: number) => ({
        id,
        name: id === 1 ? "Lavagem" : "Proteção",
        details: "Catálogo",
        approximatePrice: id === 1 ? 100 : 200.5,
        estimatedDurationMinutes: id === 1 ? 60 : 30,
        exampleWorkId: null,
        isActive: true,
        createdAt: new Date(),
      });
      storage.getAllAppointmentsWithItems = async () => conflicts;
      storage.createAppointmentBundle = async (appointment, items) => {
        storedAppointment = appointment;
        storedItems = items;
        current = appointmentFixture({ ...appointment, items });
        return current;
      };
      storage.getAppointmentWithItems = async () => current;
      storage.updateAppointmentBundle = async (_id, update, items) => {
        storedAppointment = update;
        if (items) storedItems = items;
        current = { ...current, ...update, items: items || current.items };
        return current;
      };

      const input = {
        customerName: "Maria Souza",
        customerPhone: "(11) 98888-7777",
        vehicleInfo: "Yamaha MT-03",
        startAt: "2026-09-10T15:00:00.000Z",
        items: [
          { serviceId: 1, description: "Lavagem combinada", durationMinutes: 60, agreedAmount: "100.00" },
          { serviceId: 2, description: "Proteção combinada", durationMinutes: 30, agreedAmount: "200.50" },
        ],
      };
      const created = await createAppointment(input);
      expect(storedAppointment.totalAmount).toBe("300.50");
      expect(storedAppointment.plannedEndAt.toISOString()).toBe("2026-09-10T16:30:00.000Z");
      expect(storedItems.map((item) => item.serviceName)).toEqual(["Lavagem", "Proteção"]);
      expect(created.customerPhone).toBe("11988887777");

      conflicts = [appointmentFixture({ id: 99, startAt: new Date("2026-09-10T15:30:00.000Z"), plannedEndAt: new Date("2026-09-10T16:00:00.000Z") })];
      await expect(createAppointment(input)).rejects.toBeInstanceOf(AppointmentConflictError);
      await expect(createAppointment({ ...input, allowConflict: true })).resolves.toBeTruthy();

      conflicts = [];
      current = appointmentFixture();
      await updateAppointment(42, { status: "concluido" });
      expect(storedAppointment.completedAt).toBeInstanceOf(Date);
      await updateAppointment(42, { status: "em_andamento" });
      expect(storedAppointment.completedAt).toBeNull();

      current = appointmentFixture({ status: "concluido" });
      await setAppointmentArchived(42, true);
      expect(storedAppointment.archivedAt).toBeInstanceOf(Date);
      await setAppointmentArchived(42, false);
      expect(storedAppointment.archivedAt).toBeNull();
    } finally {
      Object.assign(storage, original);
    }
  });

  test("gera orçamento identificado e valida uploads privados", () => {
    const pdf = generateBudgetPdf(appointmentFixture(), undefined);
    expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(pdf.toString("ascii")).toContain("ORCAMENTO ORC-42");
    expect(pdf.toString("ascii")).toContain("VALOR COMBINADO");
    expect(validateBudgetFile(Buffer.from("%PDF-1.4"), "application/pdf")).toBeNull();
    expect(validateBudgetFile(Buffer.from([0xff, 0xd8, 0xff, 0x00]), "image/jpeg")).toBeNull();
    expect(validateBudgetFile(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png")).toBeNull();
    expect(validateBudgetFile(Buffer.from("RIFF0000WEBP", "ascii"), "image/webp")).toBeNull();
    expect(validateBudgetFile(Buffer.from("not-a-pdf"), "application/pdf")).not.toBeNull();
    expect(validateBudgetFile(Buffer.from("plain"), "text/plain")).not.toBeNull();
    expect(BUDGET_MAX_FILE_SIZE).toBe(10 * 1024 * 1024);

    expect(resolveAppointmentBudgetsDir({ NODE_ENV: "development" }, "C:/app"))
      .toBe(path.resolve("C:/app", "backend/.runtime/appointment-budgets"));
    expect(resolveAppointmentBudgetsDir({ NODE_ENV: "production", PRIVATE_UPLOADS_DIR: "private" }, "C:/app"))
      .toBe(path.resolve("C:/app", "private/appointment-budgets"));
    expect(() => resolveAppointmentBudgetsDir({ NODE_ENV: "production" }, "C:/app"))
      .toThrow(/PRIVATE_UPLOADS_DIR/);
  });

  test("mantém os contratos de API, migração e interface administrativa", () => {
    const routes = fs.readFileSync("backend/api/routes/appointments.routes.ts", "utf8");
    const migration = fs.readFileSync("migrations/0006_admin_operational_appointments.sql", "utf8");
    const agenda = fs.readFileSync("frontend/features/admin/pages/appointments-management.tsx", "utf8");
    const dashboard = fs.readFileSync("frontend/features/admin/pages/dashboard.tsx", "utf8");

    expect(routes.match(/\/api\/appointments[^\n]+requireAdmin/g)?.length).toBeGreaterThanOrEqual(10);
    expect(routes).toContain('status(409)');
    expect(routes).toContain('code: "BUDGET_EXISTS"');
    expect(routes).not.toContain('app.delete("/api/appointments/:id",');
    expect(routes).not.toContain("/api/customer/appointments");

    expect(migration).toContain("estimated_duration_minutes");
    expect(migration).toContain("appointment_items");
    expect(migration).toContain("ROUND(`estimated_price` / 100, 2)");
    expect(migration).toContain("WHEN `status` = 'pre_agendamento' THEN 'agendado_nao_iniciado'");

    expect(agenda).toContain("function MonthCalendar");
    expect(agenda).toContain("onCreate={openNewAppointment}");
    expect(agenda).toContain("calendar-day-${key}");
    expect(agenda).toContain("group-hover:opacity-100");
    expect(agenda).toContain("isToday");
    expect(agenda).toContain("isWeekend");
    expect(agenda).toContain('`${initialDate}T09:00`');
    expect(agenda).toContain("Buscar ou cadastrar serviço...");
    expect(agenda).toContain("Cadastrar serviço avulso");
    expect(agenda).toContain("selectOrCreateService");
    expect(agenda).toContain("Nenhum serviço ativo no catálogo");
    expect(agenda).toContain('data-testid="button-add-appointment-service"');
    expect(agenda).toContain('data-testid="button-confirm-appointment-service"');
    expect(agenda).toContain("appointment-service-item-${index}");
    expect(agenda).toContain("Serviço já adicionado");
    expect(agenda).toContain("CustomerPhoneInput");
    expect(agenda).toContain("Revise os campos destacados");
    expect(agenda).toContain("border-destructive focus-visible:ring-destructive");
    expect(agenda).toContain('data-testid="input-appointment-email"');
    expect(agenda).toContain("Início");
    expect(agenda).toContain("Proprietário");
    expect(agenda).toContain("Orçamento");
    expect(agenda).toContain('className="space-y-3 md:hidden"');
    expect(dashboard).toContain("Resumo da Agenda");
    expect(dashboard).not.toContain("updateAppointmentMutation");
  });
});
