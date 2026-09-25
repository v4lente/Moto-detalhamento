import { expect, test } from "@playwright/test";
import fs from "node:fs";

test.describe("migration de pagamento e analytics", () => {
  const migration = fs.readFileSync("migrations/0009_order_payment_analytics.sql", "utf8");
  const schema = fs.readFileSync("shared/schema.ts", "utf8");

  test("preserva dados antigos como legacy e deixa novos pedidos explicit", () => {
    expect(migration).toContain("DEFAULT 'legacy'");
    expect(migration).toContain("SET `payment_tracking_mode` = 'legacy'");
    expect(migration).toContain("SET DEFAULT 'explicit'");
    expect(schema).toContain('paymentTrackingMode: varchar("payment_tracking_mode"');
    expect(schema).toContain('.default("explicit")');
  });

  test("separa os comandos para execução pelo migrador Drizzle", () => {
    const statements = migration
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    expect(statements).toHaveLength(4);
  });

  test("cria trilha com FK, cronologia e idempotência", () => {
    expect(migration).toContain("CREATE TABLE `order_payment_events`");
    expect(migration).toMatch(/FOREIGN KEY \(`order_id`\).*REFERENCES `orders`\(`id`\)/);
    expect(migration).toContain("UNIQUE(`order_id`, `request_key`)");
    expect(migration).toContain("`order_id`, `created_at`");
  });

  test("mantém o journal alinhado", () => {
    const journal = JSON.parse(fs.readFileSync("migrations/meta/_journal.json", "utf8"));
    expect(journal.entries.at(-1)?.tag).toBe("0009_order_payment_analytics");
  });
});
