import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida. Configure a variável de ambiente.");
}

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
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
