import { expect, test } from "@playwright/test";
import fs from "node:fs";

test("pagamento manual exige admin, CSRF e chave idempotente", async ({ request }) => {
  const routes = fs.readFileSync("backend/api/routes/orders.routes.ts", "utf8");
  const index = fs.readFileSync("backend/api/routes/index.ts", "utf8");
  expect(routes).toContain('app.post("/api/orders/:reference/payment", requireAdmin');
  expect(routes).toContain('req.get("idempotency-key")');
  expect(index).toContain('app.use("/api", csrfProtection)');
  const response = await request.post("/api/orders/DV-TEST/payment", { data: { action: "mark_paid" } });
  expect([401, 403]).toContain(response.status());
});

test("detalhe mantém as duas trilhas", () => {
  const routes = fs.readFileSync("backend/api/routes/orders.routes.ts", "utf8");
  expect(routes).toContain("storage.getOrderEvents(order.id)");
  expect(routes).toContain("storage.getOrderPaymentEvents(order.id)");
  expect(routes).toContain("items, events, paymentEvents");
});
