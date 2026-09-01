import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { createCustomerOrder, previewCheckout, type CheckoutItemInput } from "@/shared/lib/api";

export function useCheckoutFlow(items: CheckoutItemInput[]) {
  const idempotencyKey = useRef(crypto.randomUUID());
  const preview = useMutation({ mutationFn: () => previewCheckout(items) });
  const order = useMutation({ mutationFn: (input: { fingerprint: string; paymentMethod?: "whatsapp" | "card" | "pix" }) => createCustomerOrder({ items, ...input }, idempotencyKey.current) });
  return { preview, order, resetIdempotencyKey: () => { idempotencyKey.current = crypto.randomUUID(); } };
}
