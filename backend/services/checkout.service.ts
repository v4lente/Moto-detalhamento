import type Stripe from "stripe";
import { storage } from "../infrastructure/storage";
import {
  createCheckoutSession,
  constructWebhookEvent,
  getCheckoutSession,
  isStripeConfigured,
} from "../infrastructure/payments/stripe.service";
import type { CheckoutData, StripeCheckoutData } from "@shared/schema";

export interface WhatsAppCheckoutResult {
  orderId: number;
  whatsappMessage: string;
  whatsappNumber: string;
  customerId: string;
}

export interface StripeCheckoutResult {
  orderId: number;
  sessionId: string;
  checkoutUrl: string | null;
  customerId: string;
}

export interface PaymentStatusResult {
  orderId: number;
  status: string;
  paymentStatus?: string;
  stripeStatus?: string;
}

/**
 * Process checkout via WhatsApp: create order, order items, and return
 * WhatsApp message + number for client to send.
 */
export async function processWhatsAppCheckout(
  data: CheckoutData
): Promise<WhatsAppCheckoutResult> {
  const { customer: customerData, items, total } = data;

  let customer = await storage.getCustomerByPhone(customerData.phone);
  if (!customer && customerData.email) {
    customer = await storage.getCustomerByEmail(customerData.email);
  }

  if (!customer) {
    customer = await storage.createCustomer({
      name: customerData.name,
      phone: customerData.phone,
      email: customerData.email || null,
      nickname: customerData.nickname || null,
      deliveryAddress: customerData.deliveryAddress || null,
      isRegistered: false,
    });
  } else {
    await storage.updateCustomer(customer.id, {
      name: customerData.name,
      deliveryAddress: customerData.deliveryAddress || customer.deliveryAddress,
    });
  }

  const itemsList = items
    .map(
      (item) =>
        `• ${item.quantity}x ${item.productName} - R$ ${(item.productPrice * item.quantity).toFixed(2)}`
    )
    .join("\n");

  const whatsappMessage =
    `🏍️ *Novo Pedido*\n\n` +
    `*Cliente:* ${customerData.name}\n` +
    `*Telefone:* ${customerData.phone}\n` +
    (customerData.email ? `*Email:* ${customerData.email}\n` : "") +
    (customerData.deliveryAddress ? `*Endereço:* ${customerData.deliveryAddress}\n` : "") +
    `\n*Itens:*\n${itemsList}\n\n` +
    `*Total: R$ ${total.toFixed(2)}*`;

  const order = await storage.createOrder({
    customerId: customer.id,
    status: "pending",
    total,
    customerName: customerData.name,
    customerPhone: customerData.phone,
    customerEmail: customerData.email || null,
    deliveryAddress: customerData.deliveryAddress || null,
    whatsappMessage,
  });

  for (const item of items) {
    await storage.createOrderItem({
      orderId: order.id,
      productId: item.productId,
      productName: item.productName,
      productPrice: item.productPrice,
      quantity: item.quantity,
    });
  }

  const settings = await storage.getSiteSettings();
  const whatsappNumber = settings?.whatsappNumber || "";

  return {
    orderId: order.id,
    whatsappMessage,
    whatsappNumber,
    customerId: customer.id,
  };
}

/**
 * Process checkout via Stripe: create order, order items, Stripe session,
 * and return checkout URL.
 */
export async function processStripeCheckout(
  data: StripeCheckoutData
): Promise<StripeCheckoutResult | null> {
  if (!isStripeConfigured()) {
    return null;
  }

  const { customer: customerData, items, total, paymentMethod } = data;

  let customer = await storage.getCustomerByPhone(customerData.phone);
  if (!customer && customerData.email) {
    customer = await storage.getCustomerByEmail(customerData.email);
  }

  if (!customer) {
    customer = await storage.createCustomer({
      name: customerData.name,
      phone: customerData.phone,
      email: customerData.email || null,
      nickname: customerData.nickname || null,
      deliveryAddress: customerData.deliveryAddress || null,
      isRegistered: false,
    });
  } else {
    await storage.updateCustomer(customer.id, {
      name: customerData.name,
      deliveryAddress: customerData.deliveryAddress || customer.deliveryAddress,
    });
  }

  const order = await storage.createOrder({
    customerId: customer.id,
    status: "awaiting_payment",
    total,
    customerName: customerData.name,
    customerPhone: customerData.phone,
    customerEmail: customerData.email || null,
    deliveryAddress: customerData.deliveryAddress || null,
    whatsappMessage: null,
    paymentMethod,
    paymentStatus: "awaiting_payment",
  });

  for (const item of items) {
    await storage.createOrderItem({
      orderId: order.id,
      productId: item.productId,
      productName: item.productName,
      productPrice: item.productPrice,
      quantity: item.quantity,
    });
  }

  const session = await createCheckoutSession(
    items,
    customerData,
    order.id,
    paymentMethod
  );

  if (!session) {
    await storage.updateOrderStatus(order.id, "payment_failed");
    return null;
  }

  await storage.updateOrderPayment(order.id, {
    stripeSessionId: session.id,
  });

  return {
    orderId: order.id,
    sessionId: session.id,
    checkoutUrl: session.url,
    customerId: customer.id,
  };
}

/**
 * Handle Stripe webhook events: update order status based on event type.
 */
export async function handleStripeWebhook(
  rawBody: Buffer,
  signature: string
): Promise<{ success: boolean; error?: string }> {
  if (!signature) {
    return { success: false, error: "Missing stripe-signature header" };
  }

  const event = constructWebhookEvent(rawBody, signature);
  if (!event) {
    return { success: false, error: "Invalid webhook signature" };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = parseInt(session.metadata?.orderId || "0");

      if (orderId) {
        await storage.updateOrderStatus(orderId, "paid");
        await storage.updateOrderPayment(orderId, {
          paymentStatus: "paid",
          stripePaymentIntentId: session.payment_intent as string,
          paidAt: new Date(),
        });
        console.log(`Order ${orderId} marked as paid`);
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = parseInt(session.metadata?.orderId || "0");

      if (orderId) {
        await storage.updateOrderStatus(orderId, "payment_failed");
        await storage.updateOrderPayment(orderId, {
          paymentStatus: "failed",
        });
        console.log(`Order ${orderId} payment expired`);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const order = await storage.getOrderByStripePaymentIntent(paymentIntent.id);
      if (order) {
        await storage.updateOrderStatus(order.id, "payment_failed");
        await storage.updateOrderPayment(order.id, {
          paymentStatus: "failed",
        });
        console.log(`Order ${order.id} payment failed`);
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;
      if (paymentIntentId) {
        const order = await storage.getOrderByStripePaymentIntent(paymentIntentId);
        if (order) {
          await storage.updateOrderStatus(order.id, "refunded");
          await storage.updateOrderPayment(order.id, {
            paymentStatus: "refunded",
          });
          console.log(`Order ${order.id} refunded`);
        }
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return { success: true };
}

/**
 * Get order payment status, optionally enriched with Stripe session status.
 */
export async function getOrderPaymentStatus(
  orderId: number
): Promise<PaymentStatusResult | null> {
  const order = await storage.getOrder(orderId);
  if (!order) return null;

  if (order.stripeSessionId && isStripeConfigured()) {
    const session = await getCheckoutSession(order.stripeSessionId);
    if (session) {
      return {
        orderId: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus ?? undefined,
        stripeStatus: session.payment_status ?? undefined,
      };
    }
  }

  return {
    orderId: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus ?? undefined,
  };
}
