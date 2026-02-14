/**
 * Shared Zod validation schemas - NO drizzle-zod imports.
 * Only imports from 'zod'.
 */

import { z } from "zod";

// ─── Checkout ───────────────────────────────────────────────────────────────
export const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    email: z.string().email().optional(),
    nickname: z.string().optional(),
    deliveryAddress: z.string().optional(),
  }),
  items: z.array(
    z.object({
      productId: z.number(),
      productName: z.string(),
      productPrice: z.number(),
      quantity: z.number().min(1),
    })
  ),
  total: z.number(),
  paymentMethod: z.enum(["card", "pix", "whatsapp"]).optional().default("whatsapp"),
});

export const stripeCheckoutSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    email: z.string().email().optional(),
    nickname: z.string().optional(),
    deliveryAddress: z.string().optional(),
  }),
  items: z.array(
    z.object({
      productId: z.number(),
      productName: z.string(),
      productPrice: z.number(),
      quantity: z.number().min(1),
    })
  ),
  total: z.number(),
  paymentMethod: z.enum(["card", "pix"]),
});

// ─── Customer ───────────────────────────────────────────────────────────────
export const registerCustomerSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10),
  name: z.string().min(2),
  nickname: z.string().optional(),
  deliveryAddress: z.string().optional(),
  password: z.string().min(6),
});

export const customerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Appointment ────────────────────────────────────────────────────────────
export const createAppointmentSchema = z.object({
  vehicleInfo: z.string().min(2, "Informe o veículo"),
  serviceDescription: z.string().min(5, "Descreva o serviço desejado"),
  preferredDate: z.string().or(z.date()),
  customerName: z.string().min(2).optional(),
  customerPhone: z.string().min(10).optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
});

export const updateAppointmentSchema = z.object({
  status: z
    .enum([
      "pre_agendamento",
      "agendado_nao_iniciado",
      "em_andamento",
      "concluido",
      "cancelado",
    ])
    .optional(),
  confirmedDate: z.string().or(z.date()).optional().nullable(),
  adminNotes: z.string().optional().nullable(),
  estimatedPrice: z.number().optional().nullable(),
});

// ─── Review ─────────────────────────────────────────────────────────────────
export const createReviewSchema = z.object({
  productId: z.number(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

// ─── OfferedService ─────────────────────────────────────────────────────────
export const insertOfferedServiceSchema = z.object({
  name: z.string(),
  details: z.string(),
  approximatePrice: z.number().nullable().optional(),
  exampleWorkId: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updateOfferedServiceSchema = z.object({
  name: z.string().min(2).optional(),
  details: z.string().min(5).optional(),
  approximatePrice: z.number().nullable().optional(),
  exampleWorkId: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
});
