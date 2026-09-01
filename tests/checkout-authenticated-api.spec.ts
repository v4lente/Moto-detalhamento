import { test, expect } from "@playwright/test";
import { checkoutPreviewSchema } from "../shared/contracts/validation";
test("preview aceita somente itens canônicos", () => { expect(checkoutPreviewSchema.safeParse({ items: [{ productId: 1, variationId: 2, quantity: 1 }] }).success).toBeTruthy(); expect(checkoutPreviewSchema.safeParse({ items: [{ productId: 1, quantity: 0 }] }).success).toBeFalsy(); });
