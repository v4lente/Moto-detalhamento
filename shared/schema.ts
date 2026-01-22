import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, real, timestamp, integer } from "drizzle-orm/pg-core";
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
