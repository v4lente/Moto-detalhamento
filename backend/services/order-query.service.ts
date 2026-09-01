import { storage } from "../infrastructure/storage";
import { ApiError } from "../api/lib/api-error";
import { toSafeCustomerProfile } from "./customer-identity.service";

export function projectOrder(order: any) {
  let addressSnapshot = null;
  if (order.addressSnapshot) {
    try { addressSnapshot = JSON.parse(order.addressSnapshot); } catch { addressSnapshot = null; }
  }
  return { ...order, addressSnapshot };
}

export async function listCustomerOrders(customerId: string, options: { page?: number; pageSize?: number; q?: string; status?: string } = {}) {
  const result = await storage.searchOrders({ customerId, page: options.page, pageSize: options.pageSize, query: options.q, status: options.status });
  return { ...result, items: result.items.map(projectOrder), totalPages: Math.ceil(result.total / result.pageSize) };
}

export async function getCustomerOrder(customerId: string, reference: string) {
  const order = await storage.getOrderByReference(reference);
  if (!order || order.customerId !== customerId) throw new ApiError(404, "NOT_FOUND", "Pedido não encontrado");
  const [items, events] = await Promise.all([storage.getOrderItems(order.id), storage.getOrderEvents(order.id)]);
  return { ...projectOrder(order), items, events };
}

export async function listAdminOrders(options: Parameters<typeof storage.searchOrders>[0] = {}) {
  const result = await storage.searchOrders(options);
  return { ...result, items: result.items.map(projectOrder), totalPages: Math.ceil(result.total / result.pageSize) };
}

export async function getAdminOrder(reference: string) {
  const order = await storage.getOrderByReference(reference) || (/^\d+$/.test(reference) ? await storage.getOrder(Number(reference)) : undefined);
  if (!order) throw new ApiError(404, "NOT_FOUND", "Pedido não encontrado");
  const [items, events, customer] = await Promise.all([
    storage.getOrderItems(order.id),
    storage.getOrderEvents(order.id),
    order.customerId ? storage.getCustomer(order.customerId) : Promise.resolve(undefined),
  ]);
  return { ...projectOrder(order), items, events, customer: customer ? toSafeCustomerProfile(customer) : null };
}
