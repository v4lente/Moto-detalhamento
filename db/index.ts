import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get directory of this file (works in ESM and bundled code)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Migrations path differs between development and production:
// - Development: db/index.ts -> ../migrations (relative to db/ folder)
// - Production (bundled): dist/index.js -> dist/migrations (same folder as bundle)
const isProduction = process.env.NODE_ENV === "production";
const migrationsPath = isProduction 
  ? path.join(__dirname, "migrations")       // dist/migrations/
  : path.join(__dirname, "..", "migrations"); // ../migrations/

// Track database availability for health checks
export let isDatabaseAvailable = false;
export let databaseError: string | null = null;

if (!process.env.DATABASE_URL) {
  console.error("WARNING: DATABASE_URL environment variable is not set");
  console.error("Database features will not work until DATABASE_URL is configured");
  databaseError = "DATABASE_URL not configured";
}

// Parse DATABASE_URL and configure SSL for cloud MySQL providers
const dbUrl = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
const isTiDB = dbUrl?.hostname.includes('tidbcloud.com') ?? false;
const isHostinger = dbUrl?.hostname.includes('gateway') || dbUrl?.hostname.includes('hostinger') || false;
const isCloudMySQL = dbUrl?.hostname.includes('railway.app') || 
                     dbUrl?.hostname.includes('planetscale.com') ||
                     dbUrl?.hostname.includes('aiven.io') ||
                     isTiDB ||
                     isHostinger;

// Create pool only if DATABASE_URL is set
const pool = process.env.DATABASE_URL 
  ? mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      // Enable SSL for cloud MySQL providers
      ...(isCloudMySQL && {
        ssl: {
          rejectUnauthorized: true,
        },
      }),
    })
  : null;

// Create drizzle instance only if pool exists
export const db = pool ? drizzle(pool) : null as any;

async function getAppliedMigrations(): Promise<Set<string>> {
  if (!pool) {
    throw new Error("Database pool not initialized - DATABASE_URL is missing");
  }
  const connection = await pool.getConnection();
  try {
    const [tables] = await connection.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = '__drizzle_migrations'
    `);
    
    const tableExists = (tables as any)[0].count > 0;
    
    if (!tableExists) {
      return new Set();
    }
    
    const [rows] = await connection.query('SELECT hash FROM `__drizzle_migrations`');
    return new Set((rows as any[]).map(row => row.hash));
  } finally {
    connection.release();
  }
}

function getPendingMigrations(): string[] {
  const journalPath = path.join(migrationsPath, 'meta', '_journal.json');
  
  console.log(`Looking for migrations journal at: ${journalPath}`);
  console.log(`Current working directory: ${process.cwd()}`);
  console.log(`__dirname: ${__dirname}`);
  
  if (!fs.existsSync(journalPath)) {
    console.log("Migration journal not found - no migrations to apply.");
    return [];
  }
  
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
  return journal.entries.map((entry: { tag: string }) => entry.tag);
}

async function checkCoreTablesExist(): Promise<boolean> {
  if (!pool) {
    throw new Error("Database pool not initialized - DATABASE_URL is missing");
  }
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name IN ('products', 'users', 'customers', 'orders')
    `);
    return (rows as any)[0].count >= 4;
  } finally {
    connection.release();
  }
}

async function markMigrationAsApplied(hash: string): Promise<void> {
  if (!pool) {
    throw new Error("Database pool not initialized - DATABASE_URL is missing");
  }
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`__drizzle_migrations\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hash VARCHAR(255) NOT NULL,
        created_at BIGINT
      )
    `);
    await connection.query(
      'INSERT IGNORE INTO `__drizzle_migrations` (hash, created_at) VALUES (?, ?)',
      [hash, Date.now()]
    );
  } finally {
    connection.release();
  }
}

export async function runMigrations() {
  console.log("Checking database migrations...");
  
  if (!pool || !db) {
    databaseError = "DATABASE_URL not configured";
    throw new Error("Cannot run migrations: DATABASE_URL is not set");
  }
  
  try {
    const appliedMigrations = await getAppliedMigrations();
    const allMigrations = getPendingMigrations();
    const coreTablesExist = await checkCoreTablesExist();
    
    const pendingMigrations = allMigrations.filter(m => !appliedMigrations.has(m));
    
    if (pendingMigrations.length === 0) {
      console.log("No pending migrations.");
      isDatabaseAvailable = true;
      databaseError = null;
      return;
    }
    
    if (coreTablesExist && appliedMigrations.size === 0 && pendingMigrations.length > 0) {
      console.log("Existing database detected - marking baseline migration as applied...");
      const baselineMigration = allMigrations[0];
      if (baselineMigration) {
        await markMigrationAsApplied(baselineMigration);
        appliedMigrations.add(baselineMigration);
        console.log(`Baseline migration '${baselineMigration}' marked as applied.`);
      }
      
      const updatedPending = allMigrations.filter(m => !appliedMigrations.has(m));
      if (updatedPending.length === 0) {
        console.log("No additional migrations to run.");
        isDatabaseAvailable = true;
        databaseError = null;
        return;
      }
      pendingMigrations.length = 0;
      pendingMigrations.push(...updatedPending);
    }
    
    console.log(`Running ${pendingMigrations.length} pending migration(s)...`);
    console.log(`Using migrations folder: ${migrationsPath}`);
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log("Migrations completed successfully!");
    isDatabaseAvailable = true;
    databaseError = null;
  } catch (error: any) {
    isDatabaseAvailable = false;
    databaseError = error.message || "Unknown database error";
    console.error("Migration failed:", error);
    throw error;
  }
}
