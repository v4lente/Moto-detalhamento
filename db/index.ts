import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import fs from "fs";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

async function getAppliedMigrations(): Promise<Set<string>> {
  const client = await pool.connect();
  try {
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '__drizzle_migrations'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      return new Set();
    }
    
    const result = await client.query('SELECT hash FROM "__drizzle_migrations"');
    return new Set(result.rows.map(row => row.hash));
  } finally {
    client.release();
  }
}

function getPendingMigrations(): string[] {
  const journalPath = path.join(process.cwd(), 'migrations', 'meta', '_journal.json');
  
  if (!fs.existsSync(journalPath)) {
    return [];
  }
  
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
  return journal.entries.map((entry: { tag: string }) => entry.tag);
}

async function checkCoreTablesExist(): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('products', 'users', 'customers', 'orders')
    `);
    return parseInt(result.rows[0].count, 10) >= 4;
  } finally {
    client.release();
  }
}

async function markMigrationAsApplied(hash: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);
    await client.query(
      'INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [hash, Date.now()]
    );
  } finally {
    client.release();
  }
}

export async function runMigrations() {
  console.log("Checking database migrations...");
  
  try {
    const appliedMigrations = await getAppliedMigrations();
    const allMigrations = getPendingMigrations();
    const coreTablesExist = await checkCoreTablesExist();
    
    const pendingMigrations = allMigrations.filter(m => !appliedMigrations.has(m));
    
    if (pendingMigrations.length === 0) {
      console.log("No pending migrations.");
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
        return;
      }
      pendingMigrations.length = 0;
      pendingMigrations.push(...updatedPending);
    }
    
    console.log(`Running ${pendingMigrations.length} pending migration(s)...`);
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("Migrations completed successfully!");
  } catch (error: any) {
    console.error("Migration failed:", error);
    throw error;
  }
}
