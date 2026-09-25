import { expect, test } from "@playwright/test";
import fs from "node:fs";

test("webhook Stripe usa evento externo como idempotência e escrita atômica", () => {
  const checkout = fs.readFileSync("backend/services/checkout.service.ts", "utf8");
  const storage = fs.readFileSync("backend/infrastructure/storage.ts", "utf8");
  expect(checkout).toContain("storage.applyStripeOrderOutcome");
  expect(checkout).toContain("requestKey: event.id");
  const operation = storage.slice(storage.indexOf("async applyStripeOrderOutcome"), storage.indexOf("async getOrderByIdempotency"));
  expect(operation).toContain("withTransaction");
});
