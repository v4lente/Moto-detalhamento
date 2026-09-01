import { test, expect } from "@playwright/test";
import fs from "node:fs";
test("flags de pagamento começam desligadas", () => { const migration = fs.readFileSync("migrations/0002_checkout_orders_expand.sql", "utf8"); expect(migration).toContain("payments_card_enabled` boolean NOT NULL DEFAULT false"); expect(migration).toContain("payments_pix_enabled` boolean NOT NULL DEFAULT false"); });
