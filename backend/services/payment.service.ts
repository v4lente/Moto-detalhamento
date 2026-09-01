import { storage } from "../infrastructure/storage";
import { createCheckoutSession, isStripeConfigured } from "../infrastructure/payments/stripe.service";
import { ApiError } from "../api/lib/api-error";

export async function getPaymentCapabilities() {
  const settings = await storage.getSiteSettings();
  return {
    card: Boolean(settings?.paymentsCardEnabled && isStripeConfigured()),
    pix: Boolean(settings?.paymentsPixEnabled && isStripeConfigured()),
    providerConfigured: isStripeConfigured(),
  };
}

export async function createPersistedPayment(order: any, items: any[], method: "card" | "pix") {
  const capabilities = await getPaymentCapabilities();
  if (!capabilities[method]) throw new ApiError(409, "PAYMENT_DISABLED", "Forma de pagamento indisponível");
  const session = await createCheckoutSession(items, { name: order.customerName, phone: order.customerPhone, email: order.customerEmail || undefined }, order.id, method);
  if (!session) throw new ApiError(503, "INTERNAL_ERROR", "Provedor de pagamento indisponível");
  return storage.updateOrderPayment(order.id, { stripeSessionId: session.id });
}
