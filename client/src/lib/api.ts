import { Product, ProductWithImages, ProductVariation, SiteSettings, UpdateSiteSettings, CheckoutData, StripeCheckoutData as SchemaStripeCheckoutData, Order, OrderItem, User, Review, Appointment, CreateAppointment, UpdateAppointment, OfferedService, InsertOfferedService, UpdateOfferedService, ServicePost, ServicePostWithMedia } from "@shared/schema";

const API_BASE = "/api";

// Products
export async function fetchProducts(): Promise<ProductWithImages[]> {
  const response = await fetch(`${API_BASE}/products`);
  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }
  return response.json();
}

export async function fetchProduct(id: number): Promise<ProductWithImages> {
  const response = await fetch(`${API_BASE}/products/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch product");
  }
  return response.json();
}

export async function createProduct(product: Omit<ProductWithImages, "id" | "createdAt">): Promise<ProductWithImages> {
  const response = await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  if (!response.ok) {
    throw new Error("Failed to create product");
  }
  return response.json();
}

export async function updateProduct(id: number, product: Partial<ProductWithImages>): Promise<ProductWithImages> {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  if (!response.ok) {
    throw new Error("Failed to update product");
  }
  return response.json();
}

export async function deleteProduct(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete product");
  }
}

// Product Variations
export async function fetchProductVariations(productId: number): Promise<ProductVariation[]> {
  const response = await fetch(`${API_BASE}/products/${productId}/variations`);
  if (!response.ok) {
    throw new Error("Failed to fetch variations");
  }
  return response.json();
}

export async function createProductVariation(productId: number, data: { label: string; price: number; inStock?: boolean }): Promise<ProductVariation> {
  const response = await fetch(`${API_BASE}/products/${productId}/variations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to create variation");
  }
  return response.json();
}

export async function updateProductVariation(id: number, data: Partial<{ label: string; price: number; inStock: boolean }>): Promise<ProductVariation> {
  const response = await fetch(`${API_BASE}/variations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to update variation");
  }
  return response.json();
}

export async function deleteProductVariation(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/variations/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to delete variation");
  }
}

// Site Settings
export async function fetchSettings(): Promise<SiteSettings> {
  const response = await fetch(`${API_BASE}/settings`);
  if (!response.ok) {
    throw new Error("Failed to fetch settings");
  }
  return response.json();
}

export async function updateSettings(settings: UpdateSiteSettings): Promise<SiteSettings> {
  const response = await fetch(`${API_BASE}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    throw new Error("Failed to update settings");
  }
  return response.json();
}

// Auth
export async function login(username: string, password: string): Promise<{ id: string; username: string }> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to login");
  }
  return response.json();
}

export async function register(username: string, password: string): Promise<{ id: string; username: string }> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to register");
  }
  return response.json();
}

export async function logout(): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to logout");
  }
}

export async function getCurrentUser(): Promise<{ id: string; username: string } | null> {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      credentials: "include",
    });
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
}

// Customer Auth
export interface CustomerData {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  nickname: string | null;
  deliveryAddress: string | null;
}

export async function customerLogin(email: string, password: string): Promise<CustomerData> {
  const response = await fetch(`${API_BASE}/customer/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to login");
  }
  return response.json();
}

export async function customerRegister(data: {
  email: string;
  password: string;
  name: string;
  phone: string;
  nickname?: string;
  deliveryAddress?: string;
}): Promise<CustomerData> {
  const response = await fetch(`${API_BASE}/customer/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to register");
  }
  return response.json();
}

export async function customerLogout(): Promise<void> {
  await fetch(`${API_BASE}/customer/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function getCurrentCustomer(): Promise<CustomerData | null> {
  try {
    const response = await fetch(`${API_BASE}/customer/me`, {
      credentials: "include",
    });
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
}

export async function updateCustomerProfile(data: Partial<CustomerData>): Promise<CustomerData> {
  const response = await fetch(`${API_BASE}/customer/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to update profile");
  }
  return response.json();
}

// Checkout
export interface CheckoutResult {
  orderId: number;
  whatsappMessage: string;
  customerId: string;
}

export async function processCheckout(data: CheckoutData): Promise<CheckoutResult> {
  const response = await fetch(`${API_BASE}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to process checkout");
  }
  return response.json();
}

// Stripe Checkout
export interface StripeCheckoutResult {
  orderId: number;
  sessionId: string;
  checkoutUrl: string;
  customerId: string;
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

export async function createStripeCheckoutSession(data: StripeCheckoutData): Promise<StripeCheckoutResult> {
  const response = await fetch(`${API_BASE}/checkout/create-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create checkout session");
  }
  return response.json();
}

export interface PaymentStatusResult {
  orderId: number;
  status: string;
  paymentStatus: string | null;
  stripeStatus?: string;
}

export async function getOrderPaymentStatus(orderId: number): Promise<PaymentStatusResult> {
  const response = await fetch(`${API_BASE}/orders/${orderId}/payment-status`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch payment status");
  }
  return response.json();
}

// Customer Orders
export async function fetchCustomerOrders(): Promise<Order[]> {
  const response = await fetch(`${API_BASE}/customer/orders`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch orders");
  }
  return response.json();
}

export async function fetchCustomerOrder(id: number): Promise<Order & { items: OrderItem[] }> {
  const response = await fetch(`${API_BASE}/customer/orders/${id}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch order");
  }
  return response.json();
}

// Admin Orders
export async function fetchAllOrders(): Promise<Order[]> {
  const response = await fetch(`${API_BASE}/orders`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch orders");
  }
  return response.json();
}

export async function fetchOrderDetails(id: number): Promise<Order & { items: OrderItem[] }> {
  const response = await fetch(`${API_BASE}/orders/${id}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch order");
  }
  return response.json();
}

export async function updateOrderStatus(id: number, status: string): Promise<Order> {
  const response = await fetch(`${API_BASE}/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to update order status");
  }
  return response.json();
}

// Admin Customer Management
import type { Customer } from "@shared/schema";

export async function fetchAllCustomers(): Promise<Customer[]> {
  const response = await fetch(`${API_BASE}/customers`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch customers");
  }
  return response.json();
}

export async function fetchCustomer(id: string): Promise<Customer> {
  const response = await fetch(`${API_BASE}/customers/${id}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch customer");
  }
  return response.json();
}

export async function createAdminCustomer(data: {
  name: string;
  phone: string;
  email?: string;
  nickname?: string;
  deliveryAddress?: string;
  password?: string;
}): Promise<Customer> {
  const response = await fetch(`${API_BASE}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create customer");
  }
  return response.json();
}

export async function updateAdminCustomer(id: string, data: Partial<{
  name: string;
  phone: string;
  email: string | null;
  nickname: string | null;
  deliveryAddress: string | null;
}>): Promise<Customer> {
  const response = await fetch(`${API_BASE}/customers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to update customer");
  }
  return response.json();
}

export async function deleteAdminCustomer(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/customers/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to delete customer");
  }
}

// Admin User Management
export type SafeUser = Omit<User, "password">;

export async function fetchAllUsers(): Promise<SafeUser[]> {
  const response = await fetch(`${API_BASE}/users`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return response.json();
}

export async function createAdminUser(data: {
  username: string;
  password: string;
  role?: "admin" | "viewer";
}): Promise<SafeUser> {
  const response = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create user");
  }
  return response.json();
}

export async function updateAdminUser(id: string, data: {
  username?: string;
  role?: "admin" | "viewer";
  password?: string;
}): Promise<SafeUser> {
  const response = await fetch(`${API_BASE}/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update user");
  }
  return response.json();
}

export async function deleteAdminUser(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/users/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete user");
  }
}

// Products with stats
export interface ProductWithStats extends ProductWithImages {
  avgRating: number;
  reviewCount: number;
  purchaseCount: number;
}

export async function fetchProductsWithStats(): Promise<ProductWithStats[]> {
  const response = await fetch(`${API_BASE}/products-with-stats`);
  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }
  return response.json();
}

// Reviews
export interface ReviewsResponse {
  reviews: Review[];
  avgRating: number;
}

export async function fetchProductReviews(productId: number): Promise<ReviewsResponse> {
  const response = await fetch(`${API_BASE}/products/${productId}/reviews`);
  if (!response.ok) {
    throw new Error("Failed to fetch reviews");
  }
  return response.json();
}

export async function createReview(productId: number, rating: number, comment?: string): Promise<Review> {
  const response = await fetch(`${API_BASE}/products/${productId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, rating, comment }),
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create review");
  }
  return response.json();
}

export interface RecentReview extends Review {
  productName: string;
  productImage: string;
}

export async function fetchRecentReviews(limit: number = 6): Promise<RecentReview[]> {
  const response = await fetch(`${API_BASE}/recent-reviews?limit=${limit}`);
  if (!response.ok) {
    throw new Error("Failed to fetch recent reviews");
  }
  return response.json();
}

export async function fetchServicePosts(): Promise<ServicePostWithMedia[]> {
  const response = await fetch(`${API_BASE}/service-posts`);
  if (!response.ok) {
    throw new Error("Failed to fetch service posts");
  }
  return response.json();
}

export async function fetchFeaturedServicePosts(limit: number = 8): Promise<ServicePostWithMedia[]> {
  const response = await fetch(`${API_BASE}/service-posts/featured?limit=${limit}`);
  if (!response.ok) {
    throw new Error("Failed to fetch featured service posts");
  }
  return response.json();
}

export async function createServicePost(post: Omit<ServicePostWithMedia, "id" | "createdAt">): Promise<ServicePostWithMedia> {
  const response = await fetch(`${API_BASE}/service-posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to create service post");
  }
  return response.json();
}

export async function updateServicePost(id: number, post: Partial<ServicePostWithMedia>): Promise<ServicePostWithMedia> {
  const response = await fetch(`${API_BASE}/service-posts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to update service post");
  }
  return response.json();
}

export async function deleteServicePost(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/service-posts/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to delete service post");
  }
}

// Appointments
export async function fetchAppointments(): Promise<Appointment[]> {
  const response = await fetch(`${API_BASE}/appointments`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch appointments");
  }
  return response.json();
}

export async function fetchAppointment(id: number): Promise<Appointment> {
  const response = await fetch(`${API_BASE}/appointments/${id}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch appointment");
  }
  return response.json();
}

export async function createAppointment(data: CreateAppointment): Promise<{ appointment: Appointment; whatsappNumber: string; message: string }> {
  const response = await fetch(`${API_BASE}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create appointment");
  }
  return response.json();
}

export async function updateAppointment(id: number, data: UpdateAppointment): Promise<Appointment> {
  const response = await fetch(`${API_BASE}/appointments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to update appointment");
  }
  return response.json();
}

export async function deleteAppointment(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/appointments/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to delete appointment");
  }
}

export async function fetchCustomerAppointments(): Promise<Appointment[]> {
  const response = await fetch(`${API_BASE}/customer/appointments`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch appointments");
  }
  return response.json();
}

// Offered Services
export async function fetchOfferedServices(): Promise<OfferedService[]> {
  const response = await fetch(`${API_BASE}/offered-services`);
  if (!response.ok) {
    throw new Error("Failed to fetch offered services");
  }
  return response.json();
}

export async function fetchAllOfferedServices(): Promise<OfferedService[]> {
  const response = await fetch(`${API_BASE}/offered-services/all`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch offered services");
  }
  return response.json();
}

export async function fetchOfferedService(id: number): Promise<OfferedService> {
  const response = await fetch(`${API_BASE}/offered-services/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch offered service");
  }
  return response.json();
}

export async function createOfferedService(service: Omit<InsertOfferedService, "id" | "createdAt">): Promise<OfferedService> {
  const response = await fetch(`${API_BASE}/offered-services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(service),
  });
  if (!response.ok) {
    throw new Error("Failed to create offered service");
  }
  return response.json();
}

export async function updateOfferedService(id: number, service: UpdateOfferedService): Promise<OfferedService> {
  const response = await fetch(`${API_BASE}/offered-services/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(service),
  });
  if (!response.ok) {
    throw new Error("Failed to update offered service");
  }
  return response.json();
}

export async function deleteOfferedService(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/offered-services/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to delete offered service");
  }
}
