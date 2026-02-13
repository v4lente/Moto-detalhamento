import { sql } from "drizzle-orm";
import { mysqlTable, text, varchar, float, timestamp, int, boolean, bigint } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Helper para criar ID auto-incremento compatível com MariaDB
// Usa bigint unsigned com autoincrement em vez de serial (que gera SQL inválido no MariaDB)
const autoIncrementId = () => bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement();

// Helper para gerar UUID na aplicação (MySQL não tem gen_random_uuid())
// UUIDs serão gerados no código Node.js usando crypto.randomUUID()

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().$default(() => "admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
}).extend({
  role: z.enum(["admin", "viewer"]).optional(),
});

export const adminCreateUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(["admin", "viewer"]).default("admin"),
});

export const adminUpdateUserSchema = z.object({
  username: z.string().min(3).optional(),
  role: z.enum(["admin", "viewer"]).optional(),
  password: z.string().min(6).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const products = mysqlTable("products", {
  id: autoIncrementId(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: float("price").notNull(),
  image: text("image").notNull(),
  // Removido: images array - agora usa tabela product_images
  category: text("category").notNull(),
  inStock: boolean("in_stock").notNull().$default(() => true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabela normalizada para imagens de produtos (substitui o array images)
export const productImages = mysqlTable("product_images", {
  id: autoIncrementId(),
  productId: bigint("product_id", { mode: "number", unsigned: true }).notNull().references(() => products.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  sortOrder: int("sort_order").notNull().$default(() => 0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductImageSchema = createInsertSchema(productImages).omit({
  id: true,
  createdAt: true,
});

export type InsertProductImage = z.infer<typeof insertProductImageSchema>;
export type ProductImage = typeof productImages.$inferSelect;

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
}).extend({
  // Campo virtual para receber array de imagens na API
  images: z.array(z.string()).optional().default([]),
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Tipo estendido para produto com imagens (usado na API)
export type ProductWithImages = Product & { images: string[] };

export const productVariations = mysqlTable("product_variations", {
  id: autoIncrementId(),
  productId: bigint("product_id", { mode: "number", unsigned: true }).notNull().references(() => products.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  price: float("price").notNull(),
  inStock: boolean("in_stock").notNull().$default(() => true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductVariationSchema = createInsertSchema(productVariations).omit({
  id: true,
  createdAt: true,
});

export type InsertProductVariation = z.infer<typeof insertProductVariationSchema>;
export type ProductVariation = typeof productVariations.$inferSelect;

export const siteSettings = mysqlTable("site_settings", {
  id: int("id").primaryKey().$default(() => 1),
  whatsappNumber: text("whatsapp_number").notNull().$default(() => "5511999999999"),
  siteName: text("site_name").notNull().$default(() => "Daniel Valente"),
  siteTagline: text("site_tagline").notNull().$default(() => "Moto Detalhamento"),
  heroTitle: text("hero_title").notNull().$default(() => "Estética"),
  heroTitleLine2: text("hero_title_line2").$default(() => "Premium"),
  heroSubtitle: text("hero_subtitle").notNull().$default(() => "Cuidado profissional para sua moto."),
  footerText: text("footer_text").notNull().$default(() => "Especialistas em detalhamento de motos."),
  copyrightText: text("copyright_text").notNull().$default(() => "© 2024 Daniel Valente Moto Detalhamento. Todos os direitos reservados."),
  logoImage: text("logo_image").$default(() => "/assets/WhatsApp_Image_2026-01-21_at_22.14.47_1769044534872.jpeg"),
  backgroundImage: text("background_image").$default(() => "/assets/WhatsApp_Image_2026-01-21_at_22.14.47_1769044534872.jpeg"),
  businessAddress: text("business_address").$default(() => ""),
  instagramUrl: text("instagram_url").$default(() => ""),
  facebookUrl: text("facebook_url").$default(() => ""),
  youtubeUrl: text("youtube_url").$default(() => ""),
});

export const updateSiteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
}).partial();

export type SiteSettings = typeof siteSettings.$inferSelect;
export type UpdateSiteSettings = z.infer<typeof updateSiteSettingsSchema>;

export const customers = mysqlTable("customers", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email"),
  phone: text("phone").notNull(),
  name: text("name").notNull(),
  nickname: text("nickname"),
  deliveryAddress: text("delivery_address"),
  password: text("password"),
  isRegistered: boolean("is_registered").$default(() => false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

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

export const adminCreateCustomerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal("")),
  nickname: z.string().optional(),
  deliveryAddress: z.string().optional(),
  password: z.string().min(6).optional(),
});

export const adminUpdateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional().or(z.literal("")).or(z.null()),
  nickname: z.string().optional().or(z.null()),
  deliveryAddress: z.string().optional().or(z.null()),
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export const orders = mysqlTable("orders", {
  id: autoIncrementId(),
  customerId: varchar("customer_id", { length: 36 }).references(() => customers.id),
  status: text("status").notNull().$default(() => "pending"),
  total: float("total").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  deliveryAddress: text("delivery_address"),
  whatsappMessage: text("whatsapp_message"),
  // Payment fields for Stripe integration
  paymentMethod: text("payment_method"), // "card", "pix", "boleto", "whatsapp"
  paymentStatus: text("payment_status").$default(() => "pending"), // "pending", "awaiting_payment", "paid", "failed", "refunded"
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export const orderItems = mysqlTable("order_items", {
  id: autoIncrementId(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).references(() => orders.id).notNull(),
  productId: bigint("product_id", { mode: "number", unsigned: true }).references(() => products.id),
  productName: text("product_name").notNull(),
  productPrice: float("product_price").notNull(),
  quantity: int("quantity").notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    email: z.string().email().optional(),
    nickname: z.string().optional(),
    deliveryAddress: z.string().optional(),
  }),
  items: z.array(z.object({
    productId: z.number(),
    productName: z.string(),
    productPrice: z.number(),
    quantity: z.number().min(1),
  })),
  total: z.number(),
  paymentMethod: z.enum(["card", "pix", "whatsapp"]).optional().default("whatsapp"),
});

export type CheckoutData = z.infer<typeof checkoutSchema>;

// Schema for Stripe checkout session creation
export const stripeCheckoutSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    email: z.string().email().optional(),
    nickname: z.string().optional(),
    deliveryAddress: z.string().optional(),
  }),
  items: z.array(z.object({
    productId: z.number(),
    productName: z.string(),
    productPrice: z.number(),
    quantity: z.number().min(1),
  })),
  total: z.number(),
  paymentMethod: z.enum(["card", "pix"]),
});

export type StripeCheckoutData = z.infer<typeof stripeCheckoutSchema>;

// Order status types
export const orderStatusEnum = z.enum([
  "pending",           // WhatsApp orders - awaiting manual confirmation
  "awaiting_payment",  // Stripe orders - waiting for payment
  "paid",              // Payment confirmed
  "confirmed",         // Order confirmed (legacy/manual)
  "shipped",           // Order shipped
  "delivered",         // Order delivered
  "cancelled",         // Order cancelled
  "payment_failed",    // Payment failed
  "refunded",          // Payment refunded
]);

export type OrderStatus = z.infer<typeof orderStatusEnum>;

// Payment status types
export const paymentStatusEnum = z.enum([
  "pending",           // Not yet processed
  "awaiting_payment",  // Checkout session created, waiting for payment
  "paid",              // Payment successful
  "failed",            // Payment failed
  "refunded",          // Payment refunded
]);

export type PaymentStatus = z.infer<typeof paymentStatusEnum>;

export const reviews = mysqlTable("reviews", {
  id: autoIncrementId(),
  productId: bigint("product_id", { mode: "number", unsigned: true }).references(() => products.id).notNull(),
  customerId: varchar("customer_id", { length: 36 }).references(() => customers.id),
  customerName: text("customer_name").notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const createReviewSchema = z.object({
  productId: z.number(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export const servicePosts = mysqlTable("service_posts", {
  id: autoIncrementId(),
  title: text("title").notNull(),
  description: text("description"),
  clientName: text("client_name"),
  vehicleInfo: text("vehicle_info"),
  // Removido: mediaUrls e mediaTypes arrays - agora usa tabela service_post_media
  featured: boolean("featured").$default(() => false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabela normalizada para mídia de service posts (substitui os arrays mediaUrls e mediaTypes)
export const servicePostMedia = mysqlTable("service_post_media", {
  id: autoIncrementId(),
  servicePostId: bigint("service_post_id", { mode: "number", unsigned: true }).notNull().references(() => servicePosts.id, { onDelete: "cascade" }),
  mediaUrl: text("media_url").notNull(),
  mediaType: text("media_type").notNull(), // "image" ou "video"
  sortOrder: int("sort_order").notNull().$default(() => 0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertServicePostMediaSchema = createInsertSchema(servicePostMedia).omit({
  id: true,
  createdAt: true,
});

export type InsertServicePostMedia = z.infer<typeof insertServicePostMediaSchema>;
export type ServicePostMedia = typeof servicePostMedia.$inferSelect;

export const insertServicePostSchema = createInsertSchema(servicePosts).omit({
  id: true,
  createdAt: true,
}).extend({
  // Campos virtuais para receber arrays na API
  mediaUrls: z.array(z.string()).optional().default([]),
  mediaTypes: z.array(z.string()).optional().default([]),
});

export type InsertServicePost = z.infer<typeof insertServicePostSchema>;
export type ServicePost = typeof servicePosts.$inferSelect;

// Tipo estendido para service post com mídia (usado na API)
export type ServicePostWithMedia = ServicePost & { mediaUrls: string[]; mediaTypes: string[] };

// Offered Services (Services that can be hired)
export const offeredServices = mysqlTable("offered_services", {
  id: autoIncrementId(),
  name: text("name").notNull(),
  details: text("details").notNull(),
  approximatePrice: float("approximate_price"),
  exampleWorkId: bigint("example_work_id", { mode: "number", unsigned: true }).references(() => servicePosts.id),
  isActive: boolean("is_active").$default(() => true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOfferedServiceSchema = createInsertSchema(offeredServices).omit({
  id: true,
  createdAt: true,
});

export const updateOfferedServiceSchema = z.object({
  name: z.string().min(2).optional(),
  details: z.string().min(5).optional(),
  approximatePrice: z.number().nullable().optional(),
  exampleWorkId: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type InsertOfferedService = z.infer<typeof insertOfferedServiceSchema>;
export type OfferedService = typeof offeredServices.$inferSelect;
export type UpdateOfferedService = z.infer<typeof updateOfferedServiceSchema>;

// Appointments / Service Scheduling
export const appointments = mysqlTable("appointments", {
  id: autoIncrementId(),
  customerId: varchar("customer_id", { length: 36 }).references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  vehicleInfo: text("vehicle_info").notNull(),
  serviceDescription: text("service_description").notNull(),
  preferredDate: timestamp("preferred_date").notNull(),
  confirmedDate: timestamp("confirmed_date"),
  status: text("status").notNull().$default(() => "pre_agendamento"),
  adminNotes: text("admin_notes"),
  estimatedPrice: float("estimated_price"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createAppointmentSchema = z.object({
  vehicleInfo: z.string().min(2, "Informe o veículo"),
  serviceDescription: z.string().min(5, "Descreva o serviço desejado"),
  preferredDate: z.string().or(z.date()),
  customerName: z.string().min(2).optional(),
  customerPhone: z.string().min(10).optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
});

export const updateAppointmentSchema = z.object({
  status: z.enum(["pre_agendamento", "agendado_nao_iniciado", "em_andamento", "concluido", "cancelado"]).optional(),
  confirmedDate: z.string().or(z.date()).optional().nullable(),
  adminNotes: z.string().optional().nullable(),
  estimatedPrice: z.number().optional().nullable(),
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type CreateAppointment = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointment = z.infer<typeof updateAppointmentSchema>;
