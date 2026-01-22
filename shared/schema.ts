import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, real, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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
