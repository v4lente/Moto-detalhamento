import Stripe from "stripe";

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn("Warning: STRIPE_SECRET_KEY not set. Stripe payments will not work.");
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey)
  : null;

// Stripe webhook secret for verifying webhook signatures
export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Helper to check if Stripe is configured
export function isStripeConfigured(): boolean {
  return !!stripe && !!stripeSecretKey;
}

// Helper to get the base URL for redirects
export function getBaseUrl(): string {
  return process.env.BASE_URL || "http://localhost:5000";
}

// Interface for line items
export interface CheckoutLineItem {
  productId: number;
  productName: string;
  productPrice: number;
  quantity: number;
}

// Interface for customer data
export interface CheckoutCustomer {
  name: string;
  phone: string;
  email?: string;
  nickname?: string;
  deliveryAddress?: string;
}

// Create a Stripe Checkout Session
export async function createCheckoutSession(
  items: CheckoutLineItem[],
  customer: CheckoutCustomer,
  orderId: number,
  paymentMethod: "card" | "pix"
): Promise<Stripe.Checkout.Session | null> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  const baseUrl = getBaseUrl();

  // Convert items to Stripe line items
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
    (item) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: item.productName,
        },
        unit_amount: Math.round(item.productPrice * 100), // Stripe uses cents
      },
      quantity: item.quantity,
    })
  );

  // Configure payment method types based on selection
  const paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] =
    paymentMethod === "pix" ? ["pix"] : ["card"];

  // Create the checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: paymentMethodTypes,
    line_items: lineItems,
    mode: "payment",
    success_url: `${baseUrl}/pedido/sucesso?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
    cancel_url: `${baseUrl}/pedido/cancelado?order_id=${orderId}`,
    customer_email: customer.email || undefined,
    metadata: {
      orderId: orderId.toString(),
      customerName: customer.name,
      customerPhone: customer.phone,
      deliveryAddress: customer.deliveryAddress || "",
    },
    // For PIX, set expiration (PIX codes expire)
    ...(paymentMethod === "pix" && {
      payment_method_options: {
        pix: {
          expires_after_seconds: 3600, // 1 hour
        },
      },
    }),
  });

  return session;
}

// Retrieve a checkout session
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session | null> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error("Error retrieving checkout session:", error);
    return null;
  }
}

// Verify webhook signature and construct event
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  if (!stripe || !stripeWebhookSecret) {
    throw new Error("Stripe webhook is not configured");
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      stripeWebhookSecret
    );
    return event;
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return null;
  }
}

// Get payment intent from session
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent | null> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error("Error retrieving payment intent:", error);
    return null;
  }
}

// Create a refund
export async function createRefund(
  paymentIntentId: string,
  amount?: number
): Promise<Stripe.Refund | null> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(amount && { amount: Math.round(amount * 100) }),
    });
    return refund;
  } catch (error) {
    console.error("Error creating refund:", error);
    return null;
  }
}
