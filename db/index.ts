import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Parse DATABASE_URL and configure SSL for cloud MySQL providers
const dbUrl = new URL(process.env.DATABASE_URL);
const isTiDB = dbUrl.hostname.includes('tidbcloud.com');
const isHostinger = dbUrl.hostname.includes('gateway') || dbUrl.hostname.includes('hostinger');
const isCloudMySQL = dbUrl.hostname.includes('railway.app') || 
                     dbUrl.hostname.includes('planetscale.com') ||
                     dbUrl.hostname.includes('aiven.io') ||
                     isTiDB ||
                     isHostinger;

const pool = mysql.createPool({
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
});

export const db = drizzle(pool);

async function getAppliedMigrations(): Promise<Set<string>> {
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
  const journalPath = path.join(process.cwd(), 'migrations', 'meta', '_journal.json');
  
  if (!fs.existsSync(journalPath)) {
    return [];
  }
  
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
  return journal.entries.map((entry: { tag: string }) => entry.tag);
}

async function checkCoreTablesExist(): Promise<boolean> {
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
