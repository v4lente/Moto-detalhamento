import type { Product, ProductWithImages, ProductVariation, SiteSettings, UpdateSiteSettings, CheckoutData, Order, OrderItem, User, Review, Appointment, CreateAppointment, UpdateAppointment, OfferedService, InsertOfferedService, UpdateOfferedService, ServicePost, ServicePostWithMedia, InsertProduct, CustomerAddress } from "@shared/contracts";
import { API_BASE } from "./api-config";
import { http } from "./http";

/**
 * Extrai mensagem de erro de uma Response HTTP de forma segura.
 * Trata respostas JSON e não-JSON (ex: HTML 503 do proxy).
 */
async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  const contentType = response.headers.get("content-type") || "";

  // Mensagens amigáveis por status HTTP comum
  const statusMessages: Record<number, string> = {
    503: "Serviço temporariamente indisponível. Tente novamente em instantes.",
    502: "Serviço temporariamente indisponível. Tente novamente em instantes.",
    504: "O servidor demorou para responder. Tente novamente.",
    500: "Erro interno do servidor. Tente novamente mais tarde.",
    429: "Muitas requisições. Aguarde um momento e tente novamente.",
  };

  // Se não for JSON, retorna mensagem baseada no status
  if (!contentType.includes("application/json")) {
    return statusMessages[response.status] || fallback;
  }

  // Tenta parsear JSON; se falhar, usa fallback
  try {
    const data = await response.json();
    // Suporta { error: "..." } ou { message: "..." }
    return data.error || data.message || fallback;
  } catch {
    return statusMessages[response.status] || fallback;
  }
}

// Products
export async function fetchProducts(includeInactive: boolean = false): Promise<ProductWithImages[]> {
  const endpoint = includeInactive ? `${API_BASE}/admin/products` : `${API_BASE}/products`;
  const response = await fetch(endpoint, includeInactive ? { credentials: "include" } : undefined);
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

export async function createProduct(product: InsertProduct): Promise<ProductWithImages> {
  return http<ProductWithImages>("/products", { method: "POST", body: JSON.stringify(product) });
}

export async function updateProduct(id: number, product: Partial<ProductWithImages>): Promise<ProductWithImages> {
  return http<ProductWithImages>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(product) });
}

export async function deleteProduct(id: number): Promise<void> {
  await http<void>(`/products/${id}`, { method: "DELETE" });
}

// Product Variations
export async function fetchProductVariations(productId: number): Promise<ProductVariation[]> {
  const response = await fetch(`${API_BASE}/products/${productId}/variations`);
  if (!response.ok) {
    throw new Error("Failed to fetch variations");
  }
  return response.json();
}

export async function fetchProductVariationCounts(): Promise<Record<number, number>> {
  const response = await fetch(`${API_BASE}/admin/products/variation-counts`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch variation counts");
  }
  return response.json();
}

export async function createProductVariation(productId: number, data: { label: string; price: number; inStock?: boolean }): Promise<ProductVariation> {
  return http<ProductVariation>(`/products/${productId}/variations`, { method: "POST", body: JSON.stringify(data) });
}

export async function updateProductVariation(id: number, data: Partial<{ label: string; price: number; inStock: boolean }>): Promise<ProductVariation> {
  return http<ProductVariation>(`/variations/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteProductVariation(id: number): Promise<void> {
  await http<void>(`/variations/${id}`, { method: "DELETE" });
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
  return http<SiteSettings>("/settings", { method: "PATCH", body: JSON.stringify(settings) });
}

// Auth
export async function login(username: string, password: string): Promise<{ id: string; username: string }> {
  return http("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
}

export async function register(username: string, password: string): Promise<{ id: string; username: string }> {
  return http("/auth/register", { method: "POST", body: JSON.stringify({ username, password }) });
}

export async function logout(): Promise<void> {
  await http<void>("/auth/logout", { method: "POST" });
}

export async function getCurrentUser(): Promise<{ id: string; username: string; role: "admin" | "viewer" } | null> {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      credentials: "include",
      cache: "no-store",
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
  documentType?: "cpf" | "cnpj" | null;
  documentMasked?: string | null;
  address?: {
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
  } | null;
  profileComplete?: boolean;
}

export async function customerLogin(email: string, password: string): Promise<CustomerData> {
  return http<CustomerData>("/customer/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export async function customerRegister(data: {
  email: string;
  password: string;
  name: string;
  phone: string;
  documentType?: "cpf" | "cnpj";
  document?: string;
  address?: {
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
  };
  /** Compatibilidade de tipagem para telas legadas; o servidor exige o novo cadastro completo. */
  nickname?: string;
  deliveryAddress?: string;
}): Promise<CustomerData> {
  return http<CustomerData>("/customer/register", { method: "POST", body: JSON.stringify(data) });
}

export async function customerLogout(): Promise<void> {
  await http<void>("/customer/logout", { method: "POST" });
}

export async function getCurrentCustomer(): Promise<CustomerData | null> {
  try {
    const response = await fetch(`${API_BASE}/customer/me`, {
      credentials: "include",
      cache: "no-store",
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
  return http<CustomerData>("/customer/me", { method: "PATCH", body: JSON.stringify(data) });
}

export interface CheckoutItemInput {
  productId: number;
  variationId?: number | null;
  quantity: number;
}

export interface CheckoutPreviewResult {
  fingerprint: string;
  items: Array<{ productId: number; productName: string; variationId: number | null; variationLabel: string | null; unitPrice: string; quantity: number; lineTotal: string }>;
  total: string;
  customer: CustomerData;
  paymentCapabilities: { card: boolean; pix: boolean };
}

export async function previewCheckout(items: CheckoutItemInput[]): Promise<CheckoutPreviewResult> {
  return http<CheckoutPreviewResult>("/checkout/preview", { method: "POST", body: JSON.stringify({ items }) });
}

export async function createCustomerOrder(data: {
  items: CheckoutItemInput[];
  fingerprint: string;
  paymentMethod?: "whatsapp" | "card" | "pix";
}, idempotencyKey: string): Promise<{ order: any; publicReference: string; whatsappShareUrl: string | null; payment: { checkoutUrl?: string; sessionId?: string } | null; replayed: boolean }> {
  return http(`/customer/orders`, { method: "POST", headers: { "Idempotency-Key": idempotencyKey }, body: JSON.stringify(data) });
}

export async function fetchCustomerOrdersPage(params: { page?: number; pageSize?: number; q?: string; status?: string } = {}) {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined) as Array<[string, string]>).toString();
  return http<{ items: Order[]; total: number; page: number; pageSize: number; totalPages: number }>(`/customer/orders${query ? `?${query}` : ""}`);
}

export async function fetchCustomerOrderByReference(reference: string) {
  return http<Order & { items: OrderItem[]; events: any[] }>(`/customer/orders/${encodeURIComponent(reference)}`);
}

// Checkout
export interface CheckoutResult {
  orderId: number;
  whatsappMessage: string;
  customerId: string;
}

export async function processCheckout(data: CheckoutData): Promise<CheckoutResult> {
  return http<CheckoutResult>("/checkout", { method: "POST", body: JSON.stringify(data) });
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
  const response = await fetch(`${API_BASE}/checkout/create-session`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
  if (!response.ok) {
    const message = await extractErrorMessage(response, "Falha ao criar sessão de pagamento");
    throw new Error(message);
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
  const data = await response.json();
  return Array.isArray(data) ? data : data.items || [];
}

export async function getOrderPaymentStatusByReference(reference: string): Promise<PaymentStatusResult & { publicReference?: string }> {
  return http(`/orders/${encodeURIComponent(reference)}/payment-status`);
}

export async function fetchPaymentCapabilities(): Promise<{ card: boolean; pix: boolean; providerConfigured: boolean }> {
  return http("/payments/capabilities");
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
  const data = await response.json();
  return Array.isArray(data) ? data : data.items || [];
}

export async function fetchOrderDetails(id: number): Promise<Order & { items: OrderItem[]; events?: Array<{ fromStatus: string | null; toStatus: string; actorType: string; createdAt: string }>; customer?: CustomerData | null }> {
  const response = await fetch(`${API_BASE}/orders/${id}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch order");
  }
  return response.json();
}

export async function revealOrderCustomerDocument(reference: string): Promise<{
  customer: CustomerData;
  documentType: "cpf" | "cnpj";
  document: string;
}> {
  return http<{ customer: CustomerData; documentType: "cpf" | "cnpj"; document: string }>(`/orders/${encodeURIComponent(reference)}/customer-document/reveal`, {
    method: "POST",
    body: JSON.stringify({ purpose: "invoice" }),
  });
}

export async function updateOrderStatus(id: number, status: string): Promise<Order> {
  return http<Order>(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}

// Admin Customer Management
import type { Customer } from "@shared/contracts";

export interface AdminCustomerInput {
  name: string;
  phone: string;
  email: string;
  nickname?: string;
  deliveryAddress?: string;
  password: string;
  documentType: "cpf" | "cnpj";
  document: string;
  address: CustomerAddress;
}

export type AdminCustomerUpdateInput = Partial<Omit<AdminCustomerInput, "email" | "nickname" | "deliveryAddress">> & {
  email?: string | null;
  nickname?: string | null;
  deliveryAddress?: string | null;
};

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

export async function createAdminCustomer(data: AdminCustomerInput): Promise<Customer> {
  return http<Customer>("/customers", { method: "POST", body: JSON.stringify(data) });
}

export async function updateAdminCustomer(id: string, data: AdminCustomerUpdateInput): Promise<Customer> {
  return http<Customer>(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteAdminCustomer(id: string): Promise<void> {
  await http<void>(`/customers/${id}`, { method: "DELETE" });
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
  return http<SafeUser>("/users", { method: "POST", body: JSON.stringify(data) });
  const response = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    const message = await extractErrorMessage(response, "Falha ao criar usuário");
    throw new Error(message);
  }
  return response.json();
}

export async function updateAdminUser(id: string, data: {
  username?: string;
  role?: "admin" | "viewer";
  password?: string;
}): Promise<SafeUser> {
  return http<SafeUser>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  const response = await fetch(`${API_BASE}/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    const message = await extractErrorMessage(response, "Falha ao atualizar usuário");
    throw new Error(message);
  }
  return response.json();
}

export async function deleteAdminUser(id: string): Promise<void> {
  await http<void>(`/users/${id}`, { method: "DELETE" });
  return;
  const response = await fetch(`${API_BASE}/users/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    const message = await extractErrorMessage(response, "Falha ao excluir usuário");
    throw new Error(message);
  }
}

// Products with stats
export interface ProductWithStats extends ProductWithImages {
  avgRating: number;
  reviewCount: number;
  purchaseCount: number;
  variations: ProductVariation[];
  variationCount: number;
  minVariationPrice: number | null;
  allVariationsOutOfStock: boolean;
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
  return http<Review>(`/products/${productId}/reviews`, { method: "POST", body: JSON.stringify({ productId, rating, comment }) });
  const response = await fetch(`${API_BASE}/products/${productId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, rating, comment }),
    credentials: "include",
  });
  if (!response.ok) {
    const message = await extractErrorMessage(response, "Falha ao criar avaliação");
    throw new Error(message);
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
  return http<ServicePostWithMedia>("/service-posts", { method: "POST", body: JSON.stringify(post) });
  const response = await fetch(`${API_BASE}/service-posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
    credentials: "include",
  });
  if (!response.ok) {
    const message = await extractErrorMessage(response, "Falha ao criar post de servico");
    throw new Error(message);
  }
  return response.json();
}

export async function updateServicePost(id: number, post: Partial<ServicePostWithMedia>): Promise<ServicePostWithMedia> {
  return http<ServicePostWithMedia>(`/service-posts/${id}`, { method: "PATCH", body: JSON.stringify(post) });
  const response = await fetch(`${API_BASE}/service-posts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
    credentials: "include",
  });
  if (!response.ok) {
    const message = await extractErrorMessage(response, "Falha ao atualizar post de servico");
    throw new Error(message);
  }
  return response.json();
}

export async function deleteServicePost(id: number): Promise<void> {
  await http<void>(`/service-posts/${id}`, { method: "DELETE" });
  return;
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
  return http("/appointments", { method: "POST", body: JSON.stringify(data) });
  const response = await fetch(`${API_BASE}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    const message = await extractErrorMessage(response, "Falha ao criar agendamento");
    throw new Error(message);
  }
  return response.json();
}

export async function updateAppointment(id: number, data: UpdateAppointment): Promise<Appointment> {
  return http<Appointment>(`/appointments/${id}`, { method: "PATCH", body: JSON.stringify(data) });
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
  await http<void>(`/appointments/${id}`, { method: "DELETE" });
  return;
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
  return http<OfferedService>("/offered-services", { method: "POST", body: JSON.stringify(service) });
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
  return http<OfferedService>(`/offered-services/${id}`, { method: "PATCH", body: JSON.stringify(service) });
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
  await http<void>(`/offered-services/${id}`, { method: "DELETE" });
  return;
  const response = await fetch(`${API_BASE}/offered-services/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to delete offered service");
  }
}
