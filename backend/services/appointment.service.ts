import { storage } from "../infrastructure/storage";
import { normalizePhone } from "./customer-identity.service";
import type {
  AppointmentItem,
  AppointmentWithItems,
  CreateAppointment,
  InsertAppointment,
  InsertAppointmentItem,
  UpdateAppointment,
} from "@shared/schema";

const BUSINESS_TIME_ZONE = "America/Sao_Paulo";

export class AppointmentConflictError extends Error {
  readonly code = "SCHEDULE_CONFLICT";

  constructor(readonly conflicts: AppointmentWithItems[]) {
    super("O horário informado conflita com outro agendamento");
    this.name = "AppointmentConflictError";
  }
}

export class AppointmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppointmentValidationError";
  }
}

type AppointmentItemInput = CreateAppointment["items"][number];

function decimalToCents(value: string): number {
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
}

function centsToDecimal(value: number): string {
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, "0")}`;
}

export function calculateAppointmentTotal(items: AppointmentItemInput[]): string | null {
  const amounts = items
    .map((item) => item.agreedAmount)
    .filter((amount): amount is string => Boolean(amount));
  if (amounts.length === 0) return null;
  return centsToDecimal(amounts.reduce((total, amount) => total + decimalToCents(amount), 0));
}

export function calculateAppointmentPlannedEnd(startAt: Date, items: Array<{ durationMinutes: number }>): Date {
  const durationMinutes = items.reduce((total, item) => total + item.durationMinutes, 0);
  return new Date(startAt.getTime() + durationMinutes * 60_000);
}

export function appointmentIntervalsOverlap(
  left: { startAt: Date; plannedEndAt: Date },
  right: { startAt: Date; plannedEndAt: Date },
): boolean {
  return left.startAt < right.plannedEndAt && left.plannedEndAt > right.startAt;
}

async function resolveCustomer(
  data: Pick<CreateAppointment, "customerId" | "customerName" | "customerPhone" | "customerEmail">,
) {
  if (data.customerId) {
    const customer = await storage.getCustomer(data.customerId);
    if (!customer) throw new AppointmentValidationError("Cliente não encontrado");
    return {
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: normalizePhone(customer.phone),
      customerEmail: customer.email || null,
    };
  }

  const customerName = data.customerName?.trim() || "";
  const customerPhone = normalizePhone(data.customerPhone || "");
  if (!customerName || customerPhone.length < 10) {
    throw new AppointmentValidationError("Nome e telefone válidos são obrigatórios para cliente avulso");
  }
  return {
    customerId: null,
    customerName,
    customerPhone,
    customerEmail: data.customerEmail || null,
  };
}

async function snapshotItems(
  inputs: AppointmentItemInput[],
): Promise<Array<Omit<InsertAppointmentItem, "appointmentId">>> {
  return Promise.all(inputs.map(async (input, sortOrder) => {
    const service = input.serviceId ? await storage.getOfferedService(input.serviceId) : null;
    if (input.serviceId && !service) throw new AppointmentValidationError("Um dos serviços selecionados não existe");
    const serviceName = service?.name || input.serviceName?.trim();
    if (!serviceName) throw new AppointmentValidationError("Informe o serviço");
    return {
      serviceId: service?.id || null,
      serviceName,
      description: input.description.trim(),
      durationMinutes: input.durationMinutes,
      agreedAmount: input.agreedAmount || null,
      sortOrder,
    };
  }));
}

function itemInputsFromSnapshots(items: AppointmentItem[]): AppointmentItemInput[] {
  return items.map((item) => ({
      serviceId: item.serviceId,
      serviceName: item.serviceName,
      description: item.description,
      durationMinutes: item.durationMinutes,
      agreedAmount: item.agreedAmount,
    }));
}

async function findConflicts(
  startAt: Date,
  plannedEndAt: Date,
  ignoreId?: number,
): Promise<AppointmentWithItems[]> {
  const appointments = await storage.getAllAppointmentsWithItems();
  return appointments.filter((appointment) =>
    appointment.id !== ignoreId &&
    !appointment.archivedAt &&
    appointment.status !== "cancelado" &&
    appointmentIntervalsOverlap(appointment, { startAt, plannedEndAt })
  );
}

export async function listAppointments(filters: {
  month?: string;
  status?: string;
  query?: string;
  archived?: string;
}): Promise<AppointmentWithItems[]> {
  const month = filters.month?.match(/^\d{4}-\d{2}$/)?.[0];
  const query = filters.query?.trim().toLocaleLowerCase("pt-BR") || "";
  const queryPhoneDigits = normalizePhone(query);
  return (await storage.getAllAppointmentsWithItems()).filter((appointment) => {
    const appointmentMonth = formatInBusinessTimeZone(appointment.startAt).slice(0, 7);
    const matchesMonth = !month || appointmentMonth === month;
    const matchesStatus = !filters.status || filters.status === "all" || appointment.status === filters.status;
    const matchesArchive = filters.archived === "all"
      || (filters.archived === "archived" ? Boolean(appointment.archivedAt) : !appointment.archivedAt);
    const searchable = [
      appointment.customerName,
      appointment.customerPhone,
      appointment.vehicleInfo,
      appointment.adminNotes || "",
      ...appointment.items.flatMap((item) => [item.serviceName, item.description]),
    ].join(" ").toLocaleLowerCase("pt-BR");
    const matchesQuery = !query
      || searchable.includes(query)
      || (queryPhoneDigits.length >= 2 && appointment.customerPhone.includes(queryPhoneDigits));
    return matchesMonth && matchesStatus && matchesArchive && matchesQuery;
  });
}

export async function createAppointment(data: CreateAppointment): Promise<AppointmentWithItems> {
  const customer = await resolveCustomer(data);
  const itemSnapshots = await snapshotItems(data.items);
  const startAt = new Date(data.startAt);
  const plannedEndAt = calculateAppointmentPlannedEnd(startAt, itemSnapshots);
  const conflicts = await findConflicts(startAt, plannedEndAt);
  if (conflicts.length > 0 && !data.allowConflict) throw new AppointmentConflictError(conflicts);

  const appointment: InsertAppointment = {
    ...customer,
    vehicleInfo: data.vehicleInfo.trim(),
    serviceDescription: itemSnapshots.map((item) => item.serviceName).join(", "),
    preferredDate: startAt,
    confirmedDate: startAt,
    startAt,
    plannedEndAt,
    completedAt: data.status === "concluido"
      ? new Date(data.completedAt || Date.now())
      : null,
    status: data.status || "agendado_nao_iniciado",
    adminNotes: data.adminNotes || null,
    totalAmount: calculateAppointmentTotal(data.items),
  };
  return storage.createAppointmentBundle(appointment, itemSnapshots);
}

export async function updateAppointment(
  id: number,
  data: UpdateAppointment,
): Promise<AppointmentWithItems> {
  const existing = await storage.getAppointmentWithItems(id);
  if (!existing) throw new AppointmentValidationError("Agendamento não encontrado");

  const customer = data.customerId !== undefined
    ? await resolveCustomer({
        customerId: data.customerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
      })
    : {
        customerId: existing.customerId,
        customerName: data.customerName?.trim() || existing.customerName,
        customerPhone: data.customerPhone ? normalizePhone(data.customerPhone) : existing.customerPhone,
        customerEmail: data.customerEmail === undefined ? existing.customerEmail : data.customerEmail || null,
      };

  const itemSnapshots = data.items ? await snapshotItems(data.items) : undefined;
  const calculationItems = data.items || itemInputsFromSnapshots(existing.items);
  const startAt = data.startAt ? new Date(data.startAt) : existing.startAt;
  const plannedEndAt = calculateAppointmentPlannedEnd(startAt, calculationItems.length > 0 ? calculationItems : existing.items);
  const status = data.status || existing.status;
  const conflicts = await findConflicts(startAt, plannedEndAt, id);
  if (status !== "cancelado" && conflicts.length > 0 && !data.allowConflict) {
    throw new AppointmentConflictError(conflicts);
  }

  let completedAt = existing.completedAt;
  if (status === "concluido") {
    completedAt = data.completedAt ? new Date(data.completedAt) : completedAt || new Date();
  } else if (existing.status === "concluido" || data.completedAt === null) {
    completedAt = null;
  }

  const updated = await storage.updateAppointmentBundle(id, {
    ...customer,
    vehicleInfo: data.vehicleInfo?.trim() || existing.vehicleInfo,
    serviceDescription: itemSnapshots
      ? itemSnapshots.map((item) => item.serviceName).join(", ")
      : existing.serviceDescription,
    preferredDate: startAt,
    confirmedDate: startAt,
    startAt,
    plannedEndAt,
    completedAt,
    status,
    adminNotes: data.adminNotes === undefined ? existing.adminNotes : data.adminNotes || null,
    totalAmount: data.items ? calculateAppointmentTotal(data.items) : existing.totalAmount,
  }, itemSnapshots);
  if (!updated) throw new AppointmentValidationError("Agendamento não encontrado");
  return updated;
}

export async function setAppointmentArchived(id: number, archived: boolean) {
  const existing = await storage.getAppointmentWithItems(id);
  if (!existing) throw new AppointmentValidationError("Agendamento não encontrado");
  if (archived && !["concluido", "cancelado"].includes(existing.status)) {
    throw new AppointmentValidationError("Somente agendamentos concluídos ou cancelados podem ser arquivados");
  }
  const updated = await storage.updateAppointmentBundle(id, { archivedAt: archived ? new Date() : null });
  if (!updated) throw new AppointmentValidationError("Agendamento não encontrado");
  return updated;
}

export async function getAppointmentSummary() {
  const appointments = (await storage.getAllAppointmentsWithItems()).filter((item) => !item.archivedAt);
  const today = formatInBusinessTimeZone(new Date());
  const now = Date.now();
  return {
    today: appointments.filter((item) => item.status !== "cancelado" && formatInBusinessTimeZone(item.startAt) === today).length,
    notStarted: appointments.filter((item) => item.status === "agendado_nao_iniciado").length,
    inProgress: appointments.filter((item) => item.status === "em_andamento").length,
    upcoming: appointments
      .filter((item) => ["agendado_nao_iniciado", "em_andamento"].includes(item.status) && item.plannedEndAt.getTime() >= now)
      .sort((left, right) => left.startAt.getTime() - right.startAt.getTime())
      .slice(0, 5),
  };
}

function formatInBusinessTimeZone(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
