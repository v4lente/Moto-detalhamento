/**
 * Pure TypeScript types - NO drizzle-orm imports.
 * Equivalent to shared/schema.ts types for use in contracts.
 */

// ─── User ───────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  username: string;
  password: string;
  role: string;
  createdAt: Date;
}

export interface InsertUser {
  username: string;
  password: string;
  role?: "admin" | "viewer";
}

// ─── Product ────────────────────────────────────────────────────────────────
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
  createdAt: Date;
}

export interface InsertProduct {
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  inStock?: boolean;
  images?: string[];
}

export type ProductWithImages = Product & { images: string[] };

// ─── ProductImage ───────────────────────────────────────────────────────────
export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  sortOrder: number;
  createdAt: Date;
}

export interface InsertProductImage {
  productId: number;
  imageUrl: string;
  sortOrder?: number;
}

// ─── ProductVariation ────────────────────────────────────────────────────────
export interface ProductVariation {
  id: number;
  productId: number;
  label: string;
  price: number;
  inStock: boolean;
  createdAt: Date;
}

export interface InsertProductVariation {
  productId: number;
  label: string;
  price: number;
  inStock?: boolean;
}

// ─── SiteSettings ───────────────────────────────────────────────────────────
export interface SiteSettings {
  id: number;
  whatsappNumber: string;
  siteName: string;
  siteTagline: string;
  heroTitle: string;
  heroTitleLine2: string | null;
  heroSubtitle: string;
  footerText: string;
  copyrightText: string;
  logoImage: string | null;
  backgroundImage: string | null;
  businessAddress: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
}

export type UpdateSiteSettings = Partial<Omit<SiteSettings, "id">>;

// ─── Customer ────────────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  email: string | null;
  phone: string;
  name: string;
  nickname: string | null;
  deliveryAddress: string | null;
  password: string | null;
  isRegistered: boolean;
  createdAt: Date;
}

export interface InsertCustomer {
  email?: string | null;
  phone: string;
  name: string;
  nickname?: string | null;
  deliveryAddress?: string | null;
  password?: string | null;
}

// ─── Order ───────────────────────────────────────────────────────────────────
export interface Order {
  id: number;
  customerId: string | null;
  status: string;
  total: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryAddress: string | null;
  whatsappMessage: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  paidAt: Date | null;
  createdAt: Date;
}

export interface InsertOrder {
  customerId?: string | null;
  status?: string;
  total: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  deliveryAddress?: string | null;
  whatsappMessage?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  paidAt?: Date | null;
}

// ─── OrderItem ───────────────────────────────────────────────────────────────
export interface OrderItem {
  id: number;
  orderId: number;
  productId: number | null;
  productName: string;
  productPrice: number;
  quantity: number;
}

export interface InsertOrderItem {
  orderId: number;
  productId?: number | null;
  productName: string;
  productPrice: number;
  quantity: number;
}

// ─── Checkout ───────────────────────────────────────────────────────────────
export interface CheckoutData {
  customer: {
    name: string;
    phone: string;
    email?: string;
    nickname?: string;
    deliveryAddress?: string;
  };
  items: Array<{
    productId: number;
    productName: string;
    productPrice: number;
    quantity: number;
  }>;
  total: number;
  paymentMethod?: "card" | "pix" | "whatsapp";
}

export interface StripeCheckoutData {
  customer: {
    name: string;
    phone: string;
    email?: string;
    nickname?: string;
    deliveryAddress?: string;
  };
  items: Array<{
    productId: number;
    productName: string;
    productPrice: number;
    quantity: number;
  }>;
  total: number;
  paymentMethod: "card" | "pix";
}

// ─── Order/Payment status enums ──────────────────────────────────────────────
export type OrderStatus =
  | "pending"
  | "awaiting_payment"
  | "paid"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "payment_failed"
  | "refunded";

export type PaymentStatus =
  | "pending"
  | "awaiting_payment"
  | "paid"
  | "failed"
  | "refunded";

// ─── Review ──────────────────────────────────────────────────────────────────
export interface Review {
  id: number;
  productId: number;
  customerId: string | null;
  customerName: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export interface InsertReview {
  productId: number;
  customerId?: string | null;
  customerName: string;
  rating: number;
  comment?: string | null;
}

// ─── ServicePost ─────────────────────────────────────────────────────────────
export interface ServicePost {
  id: number;
  title: string;
  description: string | null;
  clientName: string | null;
  vehicleInfo: string | null;
  featured: boolean;
  createdAt: Date;
}

export interface InsertServicePost {
  title: string;
  description?: string | null;
  clientName?: string | null;
  vehicleInfo?: string | null;
  featured?: boolean;
  mediaUrls?: string[];
  mediaTypes?: string[];
}

export type ServicePostWithMedia = ServicePost & {
  mediaUrls: string[];
  mediaTypes: string[];
};

// ─── ServicePostMedia ────────────────────────────────────────────────────────
export interface ServicePostMedia {
  id: number;
  servicePostId: number;
  mediaUrl: string;
  mediaType: string;
  sortOrder: number;
  createdAt: Date;
}

export interface InsertServicePostMedia {
  servicePostId: number;
  mediaUrl: string;
  mediaType: string;
  sortOrder?: number;
}

// ─── OfferedService ─────────────────────────────────────────────────────────
export interface OfferedService {
  id: number;
  name: string;
  details: string;
  approximatePrice: number | null;
  exampleWorkId: number | null;
  isActive: boolean;
  createdAt: Date;
}

export interface InsertOfferedService {
  name: string;
  details: string;
  approximatePrice?: number | null;
  exampleWorkId?: number | null;
  isActive?: boolean;
}

export interface UpdateOfferedService {
  name?: string;
  details?: string;
  approximatePrice?: number | null;
  exampleWorkId?: number | null;
  isActive?: boolean;
}

// ─── Appointment ────────────────────────────────────────────────────────────
export interface Appointment {
  id: number;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  vehicleInfo: string;
  serviceDescription: string;
  preferredDate: Date;
  confirmedDate: Date | null;
  status: string;
  adminNotes: string | null;
  estimatedPrice: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertAppointment {
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  vehicleInfo: string;
  serviceDescription: string;
  preferredDate: Date;
  confirmedDate?: Date | null;
  status?: string;
  adminNotes?: string | null;
  estimatedPrice?: number | null;
}

export interface CreateAppointment {
  vehicleInfo: string;
  serviceDescription: string;
  preferredDate: string | Date;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string | "";
}

export interface UpdateAppointment {
  status?:
    | "pre_agendamento"
    | "agendado_nao_iniciado"
    | "em_andamento"
    | "concluido"
    | "cancelado";
  confirmedDate?: string | Date | null;
  adminNotes?: string | null;
  estimatedPrice?: number | null;
}
