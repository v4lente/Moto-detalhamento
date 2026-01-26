import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, real, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
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

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  image: text("image").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  whatsappNumber: text("whatsapp_number").notNull().default("5511999999999"),
  siteName: text("site_name").notNull().default("Daniel Valente"),
  siteTagline: text("site_tagline").notNull().default("Moto Detalhamento"),
  heroTitle: text("hero_title").notNull().default("Estética Premium"),
  heroSubtitle: text("hero_subtitle").notNull().default("Cuidado profissional para sua moto."),
  footerText: text("footer_text").notNull().default("Especialistas em detalhamento de motos."),
  copyrightText: text("copyright_text").notNull().default("© 2024 Daniel Valente Moto Detalhamento. Todos os direitos reservados."),
  logoImage: text("logo_image").default("/assets/WhatsApp_Image_2026-01-21_at_22.14.47_1769044534872.jpeg"),
  backgroundImage: text("background_image").default("/assets/WhatsApp_Image_2026-01-21_at_22.14.47_1769044534872.jpeg"),
  businessAddress: text("business_address").default(""),
  instagramUrl: text("instagram_url").default(""),
  facebookUrl: text("facebook_url").default(""),
  youtubeUrl: text("youtube_url").default(""),
});

export const updateSiteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
}).partial();

export type SiteSettings = typeof siteSettings.$inferSelect;
export type UpdateSiteSettings = z.infer<typeof updateSiteSettingsSchema>;

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique(),
  phone: text("phone").notNull(),
  name: text("name").notNull(),
  nickname: text("nickname"),
  deliveryAddress: text("delivery_address"),
  password: text("password"),
  isRegistered: boolean("is_registered").default(false).notNull(),
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

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: varchar("customer_id").references(() => customers.id),
  status: text("status").notNull().default("pending"),
  total: real("total").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  deliveryAddress: text("delivery_address"),
  whatsappMessage: text("whatsapp_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  productPrice: real("product_price").notNull(),
  quantity: integer("quantity").notNull(),
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
});

export type CheckoutData = z.infer<typeof checkoutSchema>;

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  customerId: varchar("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(),
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

export const servicePosts = pgTable("service_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  clientName: text("client_name"),
  vehicleInfo: text("vehicle_info"),
  mediaUrls: text("media_urls").array().notNull(),
  mediaTypes: text("media_types").array().notNull(),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertServicePostSchema = createInsertSchema(servicePosts).omit({
  id: true,
  createdAt: true,
});

export type InsertServicePost = z.infer<typeof insertServicePostSchema>;
export type ServicePost = typeof servicePosts.$inferSelect;

// Appointments / Service Scheduling
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  customerId: varchar("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  vehicleInfo: text("vehicle_info").notNull(),
  serviceDescription: text("service_description").notNull(),
  preferredDate: timestamp("preferred_date").notNull(),
  confirmedDate: timestamp("confirmed_date"),
  status: text("status").notNull().default("pre_agendamento"),
  adminNotes: text("admin_notes"),
  estimatedPrice: real("estimated_price"),
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
