import { Product, SiteSettings, UpdateSiteSettings, CheckoutData, Order, OrderItem } from "@shared/schema";

const API_BASE = "/api";

// Products
export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE}/products`);
  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }
  return response.json();
}

export async function fetchProduct(id: number): Promise<Product> {
  const response = await fetch(`${API_BASE}/products/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch product");
  }
  return response.json();
}

export async function createProduct(product: Omit<Product, "id" | "createdAt">): Promise<Product> {
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

export async function updateProduct(id: number, product: Partial<Product>): Promise<Product> {
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
