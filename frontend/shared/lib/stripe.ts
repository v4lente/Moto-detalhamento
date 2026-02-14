import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { apiUrl } from "./api-config";

let stripePromise: Promise<Stripe | null> | null = null;

// Fetch the publishable key from the server and initialize Stripe
export async function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = (async () => {
      try {
        const response = await fetch(apiUrl("/stripe/config"));
        if (!response.ok) {
          console.error("Failed to fetch Stripe config");
          return null;
        }
        const { publishableKey } = await response.json();
        if (!publishableKey) {
          console.error("No Stripe publishable key found");
          return null;
        }
        return loadStripe(publishableKey);
      } catch (error) {
        console.error("Error initializing Stripe:", error);
        return null;
      }
    })();
  }
  return stripePromise;
}

// Redirect to Stripe Checkout using the checkout URL
// Note: In Stripe.js v8+, we use the hosted checkout URL directly
// instead of the deprecated redirectToCheckout method
export async function redirectToCheckout(checkoutUrl: string): Promise<void> {
  if (!checkoutUrl) {
    throw new Error("Checkout URL is required");
  }
  // Simply redirect to the Stripe hosted checkout page
  window.location.href = checkoutUrl;
}

// Check if Stripe is configured
export async function isStripeAvailable(): Promise<boolean> {
  try {
    const response = await fetch(apiUrl("/stripe/config"));
    if (!response.ok) return false;
    const { publishableKey } = await response.json();
    return !!publishableKey;
  } catch {
    return false;
  }
}
