import { createHash } from "node:crypto";
import type { CheckoutItemInput, CheckoutPreview, CustomerProfile } from "@shared/contracts/types";
import { storage, type CheckoutResolvedItem } from "../infrastructure/storage";
import { safeProfile } from "./customer-profile.service";
import { ApiError } from "../api/lib/api-error";

function cents(value: string | number): number {
  const text = typeof value === "number" ? value.toFixed(2) : value;
  const [whole, fraction = "00"] = text.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
}

function money(value: number): string {
  return (value / 100).toFixed(2);
}

export function fingerprintForItems(items: CheckoutResolvedItem[]): string {
  const canonical = items
    .map((item) => ({ productId: item.productId, variationId: item.variationId, quantity: item.quantity, unitPrice: item.unitPrice }))
    .sort((a, b) => a.productId - b.productId || (a.variationId || 0) - (b.variationId || 0));
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

export async function buildCheckoutPreview(customerId: string, inputItems: CheckoutItemInput[]): Promise<CheckoutPreview> {
  const customer = await storage.getCustomer(customerId);
  if (!customer) throw new ApiError(401, "UNAUTHENTICATED", "Sessão de cliente inválida");
  if (!customer.profileComplete) throw new ApiError(422, "PROFILE_INCOMPLETE", "Complete seu cadastro antes de finalizar o pedido");
  let items: CheckoutResolvedItem[];
  try {
    items = await storage.resolveCheckoutItems(inputItems);
  } catch (error: any) {
    const [kind, id] = String(error?.message || "").split(":");
    if (kind === "VARIATION_REQUIRED") throw new ApiError(422, "VALIDATION_ERROR", "Selecione uma variação para o produto", { productId: Number(id) });
    if (kind.includes("UNAVAILABLE")) throw new ApiError(409, "OUT_OF_STOCK", "Um item do carrinho não está disponível", { id: Number(id) });
    throw error;
  }
  const totalCents = items.reduce((sum, item) => sum + cents(item.lineTotal), 0);
  const settings = await storage.getSiteSettings();
  return {
    fingerprint: fingerprintForItems(items),
    items,
    total: money(totalCents),
    customer: safeProfile(customer) as CustomerProfile,
    paymentCapabilities: {
      card: Boolean(settings?.paymentsCardEnabled && process.env.STRIPE_SECRET_KEY),
      pix: Boolean(settings?.paymentsPixEnabled && process.env.STRIPE_SECRET_KEY),
    },
  };
}
