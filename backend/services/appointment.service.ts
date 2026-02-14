import { storage } from "../infrastructure/storage";
import {
  sendAppointmentRequestNotification,
  sendAppointmentStatusUpdateNotification,
} from "../infrastructure/email/resend.service";
import type { CreateAppointment, UpdateAppointment } from "@shared/schema";
import type { Appointment } from "@shared/schema";

export interface CreateAppointmentResult {
  appointment: Appointment;
  whatsappNumber: string;
  message: string;
}

export interface UpdateAppointmentResult {
  appointment: Appointment | undefined;
}

/** Session-like object with optional customerId for resolving logged-in customer */
export interface AppointmentSession {
  customerId?: string;
}

/**
 * Create appointment with admin email notification.
 * Resolves customer data from session if logged in.
 */
export async function createAppointment(
  data: CreateAppointment,
  session: AppointmentSession | undefined
): Promise<CreateAppointmentResult> {
  let customerId: string | null = null;
  let customerName = data.customerName || "";
  let customerPhone = data.customerPhone || "";
  let customerEmail = data.customerEmail || null;

  if (session?.customerId) {
    const customer = await storage.getCustomer(session.customerId);
    if (customer) {
      customerId = customer.id;
      customerName = customer.name;
      customerPhone = customer.phone;
      customerEmail = customer.email;
    }
  }

  if (!customerName || !customerPhone) {
    throw new Error("Nome e telefone são obrigatórios");
  }

  const appointment = await storage.createAppointment({
    customerId,
    customerName,
    customerPhone,
    customerEmail,
    vehicleInfo: data.vehicleInfo,
    serviceDescription: data.serviceDescription,
    preferredDate: new Date(data.preferredDate),
    status: "pre_agendamento",
  });

  const admins = await storage.getAllUsers();
  const adminEmails = admins
    .filter((u) => u.username.includes("@"))
    .map((u) => u.username);

  sendAppointmentRequestNotification(adminEmails, {
    customerName,
    customerPhone,
    customerEmail,
    vehicleInfo: data.vehicleInfo,
    serviceDescription: data.serviceDescription,
    preferredDate: new Date(data.preferredDate),
  }).catch((err) => console.error("Email notification failed:", err));

  const settings = await storage.getSiteSettings();
  const whatsappNumber = settings?.whatsappNumber || "";

  return {
    appointment,
    whatsappNumber,
    message:
      "Pré-agendamento enviado com sucesso! Entraremos em contato para confirmar após análise do veículo.",
  };
}

/**
 * Update appointment status and send email notification to customer if status changed.
 */
export async function updateAppointmentStatus(
  id: number,
  data: UpdateAppointment
): Promise<UpdateAppointmentResult> {
  const existingAppointment = await storage.getAppointment(id);
  if (!existingAppointment) {
    throw new Error("Appointment not found");
  }

  const updateData: Record<string, unknown> = { ...data };
  if (data.confirmedDate) {
    updateData.confirmedDate = new Date(data.confirmedDate);
  }

  const appointment = await storage.updateAppointment(id, updateData);

  if (data.status && existingAppointment.customerEmail) {
    sendAppointmentStatusUpdateNotification(existingAppointment.customerEmail, {
      customerName: existingAppointment.customerName,
      vehicleInfo: existingAppointment.vehicleInfo,
      newStatus: data.status,
      confirmedDate:
        (updateData.confirmedDate as Date) || appointment?.confirmedDate,
      adminNotes: data.adminNotes ?? existingAppointment.adminNotes,
      estimatedPrice: data.estimatedPrice ?? existingAppointment.estimatedPrice,
    }).catch((err) => console.error("Status notification failed:", err));
  }

  return { appointment };
}
