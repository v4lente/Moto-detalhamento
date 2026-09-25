import { expect, test } from "@playwright/test";
import fs from "node:fs";

test("estado e order_events são gravados na mesma transação", () => {
  const storage = fs.readFileSync("backend/infrastructure/storage.ts", "utf8");
  const service = fs.readFileSync("backend/services/order-status.service.ts", "utf8");
  const operation = storage.slice(storage.indexOf("async transitionOrderWithEvent"), storage.indexOf("async applyOrderPaymentChange"));
  expect(operation).toContain("withTransaction");
  expect(operation).toContain("tx.update(orders)");
  expect(operation).toContain("tx.insert(orderEvents)");
  expect(service).toContain("storage.transitionOrderWithEvent");
  expect(service).not.toContain("storage.updateOrderStatus(");
});
