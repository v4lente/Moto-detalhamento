import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";

// Get directory of this file (works in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Migrations path relative to this file (db/migrate.ts -> ../migrations)
const migrationsPath = path.join(__dirname, "..", "migrations");

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
  console.log(`Pasta de migrações: ${migrationsPath}`);
  console.log(`Diretório atual: ${process.cwd()}`);

  try {
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log("✓ Migrações aplicadas com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao aplicar migrações:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigrations().catch(() => process.exit(1));
