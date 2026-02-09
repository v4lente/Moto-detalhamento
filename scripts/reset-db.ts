import mysql from "mysql2/promise";

async function resetDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL not set");
  }

  const connection = await mysql.createConnection({
    uri: dbUrl,
    ssl: { rejectUnauthorized: true },
  });

  console.log("Connected to database");

  // Get all tables
  const [tables] = await connection.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE()
  `);

  // Disable foreign key checks
  await connection.query("SET FOREIGN_KEY_CHECKS = 0");

  // Drop all tables
  for (const table of tables as any[]) {
    const tableName = table.TABLE_NAME || table.table_name;
    console.log(`Dropping table: ${tableName}`);
    await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
  }

  // Re-enable foreign key checks
  await connection.query("SET FOREIGN_KEY_CHECKS = 1");

  console.log("All tables dropped successfully!");
  await connection.end();
}

resetDatabase().catch(console.error);
