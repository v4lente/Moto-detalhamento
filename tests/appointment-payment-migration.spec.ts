import { expect, test } from "@playwright/test";
import fs from "node:fs";

const migrationPath = "migrations/0008_appointment_payment_status.sql";
const schemaPath = "shared/schema.ts";

test.describe("migration do pagamento informativo da agenda", () => {
  test("adiciona default conservador não nulo", () => {
    const migration = fs.readFileSync(migrationPath, "utf8");
    expect(migration).toContain("ADD COLUMN `payment_status` varchar(16) NOT NULL DEFAULT 'nao_pago'");
    expect(migration).not.toContain("orders");
    expect(migration).not.toContain("stripe");
  });

  test("não cria vínculo financeiro nem estado inválido por definição", () => {
    const migration = fs.readFileSync(migrationPath, "utf8");
    expect(migration).toContain("AFTER `status`");
    expect(migration).not.toMatch(/FOREIGN KEY|TRIGGER/i);
    expect(migration).not.toMatch(/payment_status[^;]*DEFAULT\s+NULL/i);
  });

  test("mantém o contrato Drizzle alinhado ao default da migration", () => {
    const schema = fs.readFileSync(schemaPath, "utf8");
    const appointmentsSchema = schema.slice(
      schema.indexOf("export const appointments ="),
      schema.indexOf("export const appointmentItems ="),
    );
    expect(appointmentsSchema).toContain('paymentStatus: varchar("payment_status", { length: 16 })');
    expect(appointmentsSchema).toContain('.notNull().default("nao_pago")');
    expect(appointmentsSchema).not.toMatch(/orders|stripe|webhook/i);
  });

  test("mantém o diário alinhado a todos os arquivos SQL", () => {
    const journal = JSON.parse(fs.readFileSync("migrations/meta/_journal.json", "utf8"));
    const tags = new Set(journal.entries.map((entry: { tag: string }) => entry.tag));
    const orphanMigrations = fs.readdirSync("migrations")
      .filter((file) => file.endsWith(".sql"))
      .map((file) => file.replace(/\.sql$/, ""))
      .filter((tag) => !tags.has(tag));

    expect(orphanMigrations).toEqual([]);
  });
});
