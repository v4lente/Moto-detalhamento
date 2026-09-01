import type { OrderStatus } from "@shared/contracts/types";
import { storage } from "../infrastructure/storage";
import { ApiError } from "../api/lib/api-error";

const transitions: Record<string, Set<string>> = {
  pending: new Set(["confirmed", "cancelled"]),
  awaiting_payment: new Set(["paid", "payment_failed", "cancelled"]),
  paid: new Set(["confirmed", "refunded", "cancelled"]),
  confirmed: new Set(["shipped", "cancelled"]),
  shipped: new Set(["delivered"]),
  delivered: new Set(["refunded"]),
  cancelled: new Set(),
  payment_failed: new Set(["awaiting_payment", "cancelled"]),
  refunded: new Set(),
};

export function canTransition(from: string, to: string): boolean {
  return from === to || Boolean(transitions[from]?.has(to));
}

export async function transitionOrder(orderId: number, toStatus: OrderStatus, actor: { type: "admin" | "customer" | "system"; id?: string | null }, reason?: string) {
  const order = await storage.getOrder(orderId);
  if (!order) throw new ApiError(404, "NOT_FOUND", "Pedido não encontrado");
  if (!canTransition(order.status, toStatus)) throw new ApiError(409, "INVALID_TRANSITION", `Não é possível alterar ${order.status} para ${toStatus}`);
  if (order.status === toStatus) return order;
  const updated = await storage.updateOrderStatus(orderId, toStatus);
  await storage.createOrderEvent({
    orderId,
    fromStatus: order.status,
    toStatus,
    actorType: actor.type,
    actorId: actor.id || null,
    reason: reason || null,
  });
  return updated;
}

export { transitions };
