import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida. Configure a variável de ambiente.");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function runMigrations() {
  console.log("Aplicando migrações...");

  try {
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("✓ Migrações aplicadas com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao aplicar migrações:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigrations().catch(() => process.exit(1));
