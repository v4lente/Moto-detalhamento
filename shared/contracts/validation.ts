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

// Checkout autenticado: o documento nunca trafega em claro depois do cadastro.
export const customerAddressSchema = z.object({
  street: z.string().trim().min(2).max(120),
  number: z.string().trim().min(1).max(20),
  complement: z.string().trim().max(80).optional().nullable(),
  neighborhood: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().regex(/^[A-Za-z]{2}$/),
  postalCode: z.string().trim().regex(/^\d{5}-?\d{3}$/),
});

const digits = (value: string) => value.replace(/\D/g, "");
export const cpfSchema = z.string().refine((value) => {
  const d = digits(value);
  if (d.length !== 11 || /^([0-9])\1+$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(d[i]) * (10 - i);
  let check = (sum * 10) % 11;
  if (check === 10) check = 0;
  if (check !== Number(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(d[i]) * (11 - i);
  check = (sum * 10) % 11;
  if (check === 10) check = 0;
  return check === Number(d[10]);
}, "CPF inválido");

// CNPJ aceita o formato numérico tradicional e o novo formato alfanumérico.
export const cnpjSchema = z.string().refine((value) => {
  const normalized = value.toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (normalized.length !== 14 || /^([0-9A-Z])\1+$/.test(normalized)) return false;
  const values = normalized.split("").map((char) => /\d/.test(char) ? Number(char) : char.charCodeAt(0) - 55);
  const calculate = (length: number) => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = values.slice(0, length).reduce((acc, value, index) => acc + value * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return calculate(12) === values[12] && calculate(13) === values[13];
}, "CNPJ inválido");

export const customerRegistrationSchema = z.discriminatedUnion("documentType", [
  z.object({
    documentType: z.literal("cpf"),
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email(),
    phone: z.string().trim().min(10).max(20),
    document: cpfSchema,
    password: z.string().min(8).max(128),
    address: customerAddressSchema,
  }),
  z.object({
    documentType: z.literal("cnpj"),
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email(),
    phone: z.string().trim().min(10).max(20),
    document: cnpjSchema,
    password: z.string().min(8).max(128),
    address: customerAddressSchema,
  }),
]);

export const adminCustomerCreateSchema = z.discriminatedUnion("documentType", [
  z.object({
    documentType: z.literal("cpf"),
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email(),
    phone: z.string().trim().min(10).max(20),
    document: cpfSchema,
    nickname: z.string().trim().max(120).optional(),
    password: z.string().min(8).max(128),
    address: customerAddressSchema,
  }),
  z.object({
    documentType: z.literal("cnpj"),
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email(),
    phone: z.string().trim().min(10).max(20),
    document: cnpjSchema,
    nickname: z.string().trim().max(120).optional(),
    password: z.string().min(8).max(128),
    address: customerAddressSchema,
  }),
]);

export const adminCustomerUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().optional().or(z.literal("")).or(z.null()),
  phone: z.string().trim().min(10).max(20).optional(),
  nickname: z.string().trim().max(120).optional().or(z.null()),
  deliveryAddress: z.string().trim().max(500).optional().or(z.null()),
  address: customerAddressSchema.optional(),
  documentType: z.enum(["cpf", "cnpj"]).optional(),
  document: z.string().trim().min(11).max(18).optional(),
}).superRefine((value, ctx) => {
  if ((value.documentType && !value.document) || (!value.documentType && value.document)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["document"], message: "Tipo e documento devem ser enviados juntos" });
  }
  if (value.document && value.documentType) {
    const valid = value.documentType === "cpf" ? cpfSchema.safeParse(value.document).success : cnpjSchema.safeParse(value.document).success;
    if (!valid) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["document"], message: value.documentType === "cpf" ? "CPF inválido" : "CNPJ inválido" });
  }
});

export const customerProfileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(10).max(20).optional(),
  documentType: z.enum(["cpf", "cnpj"]).optional(),
  document: z.string().trim().min(11).max(18).optional(),
  address: customerAddressSchema.optional(),
}).superRefine((value, ctx) => {
  if ((value.documentType && !value.document) || (!value.documentType && value.document)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["document"], message: "Tipo e documento devem ser enviados juntos" });
  }
  if (value.document && value.documentType) {
    const valid = value.documentType === "cpf" ? cpfSchema.safeParse(value.document).success : cnpjSchema.safeParse(value.document).success;
    if (!valid) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["document"], message: value.documentType === "cpf" ? "CPF inválido" : "CNPJ inválido" });
  }
});

export const checkoutItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  variationId: z.coerce.number().int().positive().nullable().optional(),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const checkoutPreviewSchema = z.object({
  items: z.array(checkoutItemSchema).min(1).max(100),
});

export const createOrderSchema = checkoutPreviewSchema.extend({
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  paymentMethod: z.enum(["whatsapp", "card", "pix"]).default("whatsapp"),
});

export const orderSearchSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(120).optional(),
  status: z.string().trim().max(40).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const orderStatusTransitionSchema = z.object({
  status: z.enum(["pending", "awaiting_payment", "paid", "confirmed", "shipped", "delivered", "cancelled", "payment_failed", "refunded"]),
  reason: z.string().trim().max(300).optional(),
});

export const idempotencyKeySchema = z.string().trim().min(16).max(200);

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
