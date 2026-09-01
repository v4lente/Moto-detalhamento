/**
 * Script de verificação anti-regressão para migrations.
 * Bloqueia padrões SQL incompatíveis com MariaDB.
 * 
 * Executado automaticamente no prebuild para evitar deploy de migrations quebradas.
 * 
 * Padrões bloqueados:
 * - `serial AUTO_INCREMENT` (MariaDB não suporta, usar `bigint unsigned AUTO_INCREMENT`)
 */

import { readdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "migrations");

// Padrões SQL incompatíveis com MariaDB
const INVALID_PATTERNS = [
  {
    pattern: /`\w+`\s+serial\s+AUTO_INCREMENT/gi,
    message: "Encontrado 'serial AUTO_INCREMENT' - MariaDB não suporta. Use 'bigint unsigned AUTO_INCREMENT'.",
    fix: "No schema.ts, use: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement()"
  },
  {
    pattern: /\bserial\b(?!\s*\()/gi,
    message: "Encontrado tipo 'serial' - MariaDB não suporta como tipo de coluna.",
    fix: "No schema.ts, substitua serial() por bigint() com autoincrement()"
  }
];

const REQUIRED_CHECKS = [
  { pattern: /decimal\(\s*12\s*,\s*2\s*\)/i, message: "Valores monetários devem usar DECIMAL(12,2), não FLOAT." },
  { pattern: /CREATE\s+INDEX|CREATE\s+UNIQUE\s+INDEX/i, message: "Novos relacionamentos de checkout precisam de índices explícitos." },
  { pattern: /FOREIGN\s+KEY/i, message: "Tabelas de pedido precisam declarar chaves estrangeiras." },
];

async function checkMigrations() {
  console.log("🔍 Verificando migrations para compatibilidade MariaDB...\n");
  
  let hasErrors = false;
  let filesChecked = 0;
  
  try {
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith(".sql"));
    
    if (sqlFiles.length === 0) {
      console.log("  Nenhum arquivo .sql encontrado em migrations/");
      return;
    }
    
    for (const file of sqlFiles) {
      const filePath = join(migrationsDir, file);
      const content = await readFile(filePath, "utf-8");
      filesChecked++;
      
      for (const { pattern, message, fix } of INVALID_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          hasErrors = true;
          console.error(`❌ ${file}:`);
          console.error(`   ${message}`);
          console.error(`   Ocorrências: ${matches.length}`);
          console.error(`   Correção: ${fix}\n`);
        }
      }

      if (/0002_checkout_orders/.test(file)) {
        for (const { pattern, message } of REQUIRED_CHECKS) {
          if (!pattern.test(content)) {
            hasErrors = true;
            console.error(`❌ ${file}: ${message}`);
          }
        }
      }
    }
    
    if (hasErrors) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("ERRO: Migrations contêm SQL incompatível com MariaDB.");
      console.error("Corrija os problemas acima antes de fazer deploy.");
      console.error("═══════════════════════════════════════════════════════════\n");
      process.exit(1);
    }
    
    console.log(`✓ ${filesChecked} arquivo(s) de migration verificado(s)`);
    console.log("✓ Nenhum padrão SQL incompatível encontrado\n");
    
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("  Pasta migrations/ não encontrada (ok se ainda não gerou migrations)");
      return;
    }
    throw error;
  }
}

checkMigrations().catch(err => {
  console.error("Erro ao verificar migrations:", err);
  process.exit(1);
});
