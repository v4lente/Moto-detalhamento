import { sql } from "drizzle-orm";
import { db } from "../backend/infrastructure/db";

/** Backfill idempotente; só altera campos novos e nunca imprime PII. */
async function main() {
  if (!process.env.DATABASE_URL) { console.log("DATABASE_URL ausente; backfill não executado"); return; }
  await db.execute(sql`UPDATE orders SET total_decimal = ROUND(total, 2) WHERE total_decimal IS NULL`);
  await db.execute(sql`UPDATE order_items SET unit_price_decimal = ROUND(product_price, 2) WHERE unit_price_decimal IS NULL`);
  await db.execute(sql`UPDATE orders SET public_reference = CONCAT('LEGACY-', id) WHERE public_reference IS NULL`);
  await db.execute(sql`UPDATE customers SET profile_complete = (email IS NOT NULL AND phone IS NOT NULL AND name IS NOT NULL AND document_hash IS NOT NULL AND address_street IS NOT NULL AND address_number IS NOT NULL AND address_neighborhood IS NOT NULL AND address_city IS NOT NULL AND address_state IS NOT NULL AND address_postal_code IS NOT NULL) WHERE profile_complete = false`);
  await db.execute(sql`INSERT INTO order_events (order_id, from_status, to_status, actor_type, actor_id, reason) SELECT o.id, NULL, o.status, 'system', NULL, 'Backfill inicial' FROM orders o WHERE NOT EXISTS (SELECT 1 FROM order_events e WHERE e.order_id = o.id)`);
  console.log("Backfill concluído sem dados pessoais no output");
}
main().catch((error) => { console.error("Backfill falhou", error instanceof Error ? error.message : error); process.exitCode = 1; });
