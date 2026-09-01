import { sql } from "drizzle-orm";
import { db, isDatabaseAvailable } from "../backend/infrastructure/db";

/** Read-only report used before the checkout migrations/backfill. */
async function main() {
  const report: Record<string, unknown> = { generatedAt: new Date().toISOString(), databaseAvailable: isDatabaseAvailable, checks: {} };
  if (!process.env.DATABASE_URL) {
    report.checks = { database: "DATABASE_URL ausente; nenhuma escrita executada" };
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  try {
    const checks: any = report.checks;
    checks.customers = (await db.execute(sql`SELECT COUNT(*) AS total, SUM(password IS NULL) AS incomplete FROM customers`))[0];
    checks.orders = (await db.execute(sql`SELECT COUNT(*) AS total, SUM(customer_id IS NULL) AS orphaned, SUM(total < 0) AS negativeTotals FROM orders`))[0];
    checks.orderItems = (await db.execute(sql`SELECT COUNT(*) AS total, SUM(quantity <= 0) AS invalidQuantity FROM order_items`))[0];
    checks.statuses = await db.execute(sql`SELECT status, COUNT(*) AS total FROM orders GROUP BY status`);
    checks.duplicateEmails = await db.execute(sql`SELECT LOWER(email) AS email, COUNT(*) AS total FROM customers WHERE email IS NOT NULL GROUP BY LOWER(email) HAVING COUNT(*) > 1 LIMIT 20`);
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ ...report, error: error instanceof Error ? error.message : String(error) }, null, 2));
    process.exitCode = 1;
  }
}
main();
