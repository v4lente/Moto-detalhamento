import type { ManualPaymentAction, ManualPaymentResult } from "@shared/contracts";
import { ApiError } from "../api/lib/api-error";
import { storage } from "../infrastructure/storage";

async function findOrder(reference: string) {
  return await storage.getOrderByReference(reference)
    || (/^\d+$/.test(reference) ? storage.getOrder(Number(reference)) : undefined);
}

export async function changeManualOrderPayment(input: {
  reference: string;
  action: ManualPaymentAction;
  reason?: string;
  requestKey: string;
  actorId: string;
}): Promise<ManualPaymentResult> {
  const order = await findOrder(input.reference);
  if (!order) throw new ApiError(404, "NOT_FOUND", "Pedido não encontrado");
  if (order.paymentMethod !== "whatsapp") {
    throw new ApiError(409, "INVALID_PAYMENT_TRANSITION", "Pagamento manual é exclusivo de pedidos WhatsApp");
  }
  if (["cancelled", "refunded", "payment_failed"].includes(order.status)) {
    throw new ApiError(409, "INVALID_PAYMENT_TRANSITION", "O estado operacional atual não permite alterar o pagamento");
  }

  const events = await storage.getOrderPaymentEvents(order.id);
  const replay = events.find((event) => event.requestKey === input.requestKey);
  const target = input.action === "mark_paid" ? "paid" : "pending";
  if (replay) {
    if (replay.toPaymentStatus !== target || (replay.reason || null) !== (input.reason || null)) {
      throw new ApiError(409, "IDEMPOTENCY_CONFLICT", "A chave de idempotência já foi usada com outro comando");
    }
    return {
      reference: order.publicReference || String(order.id),
      status: order.status,
      paymentStatus: replay.toPaymentStatus,
      paidAt: replay.toPaymentStatus === "paid" ? replay.createdAt : null,
      paymentEvent: replay,
      replayed: true,
    };
  }

  const currentPaymentStatus = order.paymentStatus || "pending";
  if (input.action === "mark_paid" && currentPaymentStatus === "paid") {
    throw new ApiError(409, "INVALID_PAYMENT_TRANSITION", "O pedido já está pago");
  }
  if (input.action === "revert_to_pending") {
    const hasManualPayment = events.some((event) => event.source === "manual_whatsapp" && event.toPaymentStatus === "paid");
    if (currentPaymentStatus !== "paid" || !hasManualPayment) {
      throw new ApiError(409, "INVALID_PAYMENT_TRANSITION", "Somente um pagamento manual pode ser revertido");
    }
  }

  try {
    const result = await storage.applyOrderPaymentChange({
      orderId: order.id,
      expectedPaymentStatus: currentPaymentStatus,
      toPaymentStatus: target,
      paidAt: target === "paid" ? new Date() : null,
      actorType: "admin",
      actorId: input.actorId,
      source: "manual_whatsapp",
      reason: input.reason || null,
      requestKey: input.requestKey,
    });
    return {
      reference: result.order.publicReference || String(result.order.id),
      status: result.order.status,
      paymentStatus: result.order.paymentStatus || target,
      paidAt: result.order.paidAt,
      paymentEvent: result.event,
      replayed: result.replayed,
    };
  } catch (error: any) {
    if (error?.code === "IDEMPOTENCY_CONFLICT") throw new ApiError(409, "IDEMPOTENCY_CONFLICT", "A chave de idempotência já foi usada com outro comando");
    if (error?.code === "PAYMENT_STATUS_CONFLICT") throw new ApiError(409, "INVALID_PAYMENT_TRANSITION", "O pagamento mudou enquanto a ação era processada");
    throw error;
  }
}
