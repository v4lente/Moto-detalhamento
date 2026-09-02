import type Stripe from "stripe";
import type { CheckoutItemInput } from "@shared/contracts/types";
import { storage } from "../infrastructure/storage";
import { ApiError } from "../api/lib/api-error";
import { buildCheckoutPreview } from "./order-pricing.service";
import { transitionOrder } from "./order-status.service";
import { constructWebhookEvent, getCheckoutSession, isStripeConfigured } from "../infrastructure/payments/stripe.service";

export async function createPersistedOrder(input: {
  customerId: string;
  items: CheckoutItemInput[];
  fingerprint: string;
  idempotencyKey: string;
  paymentMethod?: "whatsapp" | "card" | "pix";
}) {
  const customer = await storage.getCustomer(input.customerId);
  if (!customer) throw new ApiError(401, "UNAUTHENTICATED", "Sessão de cliente inválida");
  const preview = await buildCheckoutPreview(input.customerId, input.items);
  if (preview.fingerprint !== input.fingerprint) throw new ApiError(409, "PRICE_CHANGED", "Os preços do carrinho mudaram. Revise o pedido.", { preview });
  const paymentMethod = input.paymentMethod || "whatsapp";
  if (paymentMethod !== "whatsapp" && !preview.paymentCapabilities[paymentMethod]) {
    throw new ApiError(409, "PAYMENT_DISABLED", "Esta forma de pagamento está temporariamente indisponível");
  }
  const order = await storage.createOrderBundle({
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerEmail: customer.email || "",
    documentMasked: customer.documentMasked,
    addressSnapshot: preview.customer.address ? JSON.stringify(preview.customer.address) : null,
    items: preview.items,
    total: preview.total,
    fingerprint: preview.fingerprint,
    idempotencyKey: input.idempotencyKey,
    paymentMethod,
  });
  return { ...order, preview };
}

export function buildWhatsAppShare(reference: string, whatsappNumber: string, customerName: string) {
  const message = `Olá, sou o ${customerName}, acabei de realizar o pedido ${reference}, fico aguardo para combinarmos o pagamento, obrigado!`;
  return `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string): Promise<{ success: boolean; error?: string }> {
  if (!signature) return { success: false, error: "Missing stripe-signature header" };
  const event = constructWebhookEvent(rawBody, signature);
  if (!event) return { success: false, error: "Invalid webhook signature" };
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = Number(session.metadata?.orderId || 0);
      if (orderId) {
        const order = await storage.getOrder(orderId);
        if (order && order.status !== "paid") {
          await transitionOrder(orderId, "paid", { type: "system" }, "Stripe checkout.session.completed");
          await storage.updateOrderPayment(orderId, { paymentStatus: "paid", stripePaymentIntentId: session.payment_intent as string, paidAt: new Date() });
        }
      }
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = Number(session.metadata?.orderId || 0);
      if (orderId) {
        const order = await storage.getOrder(orderId);
        if (order && order.status === "awaiting_payment") {
          await transitionOrder(orderId, "payment_failed", { type: "system" }, "Stripe sessão expirada");
          await storage.updateOrderPayment(orderId, { paymentStatus: "failed" });
        }
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const order = await storage.getOrderByStripePaymentIntent((event.data.object as Stripe.PaymentIntent).id);
      if (order && order.status === "awaiting_payment") {
        await transitionOrder(order.id, "payment_failed", { type: "system" }, "Stripe pagamento falhou");
        await storage.updateOrderPayment(order.id, { paymentStatus: "failed" });
      }
      break;
    }
    case "charge.refunded": {
      const paymentIntentId = (event.data.object as Stripe.Charge).payment_intent as string;
      const order = paymentIntentId ? await storage.getOrderByStripePaymentIntent(paymentIntentId) : undefined;
      if (order && order.status !== "refunded") {
        await transitionOrder(order.id, "refunded", { type: "system" }, "Stripe charge.refunded");
        await storage.updateOrderPayment(order.id, { paymentStatus: "refunded" });
      }
      break;
    }
  }
  return { success: true };
}

export async function getOrderPaymentStatus(orderId: number) {
  const order = await storage.getOrder(orderId);
  if (!order) return null;
  if (order.stripeSessionId && isStripeConfigured()) {
    const session = await getCheckoutSession(order.stripeSessionId);
    return { orderId: order.id, publicReference: order.publicReference, status: order.status, paymentStatus: order.paymentStatus, stripeStatus: session?.payment_status };
  }
  return { orderId: order.id, publicReference: order.publicReference, status: order.status, paymentStatus: order.paymentStatus };
}
