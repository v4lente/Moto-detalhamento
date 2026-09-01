import { test, expect } from "@playwright/test";
import { createOrderSchema } from "../shared/contracts/validation";
test("idempotência exige fingerprint sha256", () => { expect(createOrderSchema.safeParse({ items: [{ productId: 1, quantity: 1 }], fingerprint: "a".repeat(64), paymentMethod: "whatsapp" }).success).toBeTruthy(); });
