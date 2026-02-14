/**
 * Script para executar migrations em produção.
 * Executado automaticamente após o build via postbuild hook.
 * 
 * Este script:
 * - Carrega variáveis de ambiente
 * - Conecta ao banco MySQL usando DATABASE_URL
 * - Executa as migrations da pasta dist/migrations (ou migrations/ em dev)
 * - É idempotente - só aplica migrations que ainda não foram executadas
 */

import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { access, constants } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determina o caminho das migrations baseado no ambiente
// - Produção (executado de dist/): usa dist/migrations
// - Desenvolvimento (executado de scripts/): usa migrations/
async function getMigrationsPath() {
  const rootDir = join(__dirname, "..");
  
  // Primeiro tenta dist/migrations (produção)
  const distMigrations = join(rootDir, "dist", "migrations");
  try {
    await access(distMigrations, constants.F_OK);
    return distMigrations;
  } catch {
    // Fallback para migrations/ (desenvolvimento)
    return join(rootDir, "migrations");
  }
}

async function runMigrations() {
  // Verifica se DATABASE_URL está definida
  if (!process.env.DATABASE_URL) {
    console.log("⚠ DATABASE_URL não definida. Pulando migrations.");
    console.log("  Configure a variável de ambiente DATABASE_URL para aplicar migrations.");
    return;
  }

  const migrationsPath = await getMigrationsPath();
  
  console.log("Aplicando migrations...");
  console.log(`  Pasta de migrations: ${migrationsPath}`);
  console.log(`  Diretório atual: ${process.cwd()}`);

  let pool;
  try {
    // Cria pool de conexões
    pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 30000, // 30 segundos de timeout
    });

    // Testa conexão antes de migrar
    console.log("  Testando conexão com o banco...");
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log("  ✓ Conexão estabelecida");

    // Executa migrations
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder: migrationsPath });
    
    console.log("✓ Migrations aplicadas com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao aplicar migrations:", error.message);
    
    // Log detalhado para debug
    if (error.code) {
      console.error(`  Código do erro: ${error.code}`);
    }
    if (error.errno) {
      console.error(`  Errno: ${error.errno}`);
    }
    
    // Não lança erro para não interromper o deploy
    // As migrations podem ser aplicadas manualmente se necessário
    console.log("⚠ O deploy continuará, mas as tabelas podem não estar criadas.");
    console.log("  Execute 'npm run db:migrate' manualmente se necessário.");
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Executa
runMigrations().catch((err) => {
  console.error("Erro fatal nas migrations:", err);
  // Não usa process.exit(1) para não interromper o deploy
});
