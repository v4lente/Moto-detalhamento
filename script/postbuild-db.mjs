/**
 * Script orquestrador de banco de dados pós-build.
 * Executado automaticamente após o build via postbuild hook.
 * 
 * Este script:
 * 1. Executa migrations (cria/atualiza tabelas)
 * 2. Executa seed --if-empty (popula dados iniciais apenas se banco vazio)
 * 
 * Ambos os passos são resilientes a falhas para não interromper o deploy.
 * Se DATABASE_URL não estiver definida, pula silenciosamente.
 */

import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Executa um script Node e retorna uma Promise.
 * Não lança erro em caso de falha (deploy continua).
 */
function runScript(scriptPath, args = []) {
  return new Promise((resolve) => {
    const child = spawn("node", [scriptPath, ...args], {
      stdio: "inherit",
      cwd: join(__dirname, ".."),
      env: process.env,
    });

    child.on("close", (code) => {
      resolve(code === 0);
    });

    child.on("error", (err) => {
      console.error(`Erro ao executar ${scriptPath}:`, err.message);
      resolve(false);
    });
  });
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  POSTBUILD: Configuração do Banco de Dados");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Verificar se DATABASE_URL está definida
  if (!process.env.DATABASE_URL) {
    console.log("⚠ DATABASE_URL não definida. Pulando configuração do banco.");
    console.log("  Configure a variável de ambiente DATABASE_URL para:");
    console.log("  - Aplicar migrations");
    console.log("  - Popular dados iniciais\n");
    return;
  }

  // 1. Executar migrations
  console.log("┌─────────────────────────────────────────────────────────┐");
  console.log("│  PASSO 1: Migrations                                    │");
  console.log("└─────────────────────────────────────────────────────────┘\n");

  const migrationsOk = await runScript(join(__dirname, "run-migrations.mjs"));
  
  if (!migrationsOk) {
    console.log("\n⚠ Migrations falharam. Seed será pulado.");
    console.log("  Verifique os logs acima e execute manualmente se necessário.\n");
    return;
  }

  // 2. Executar seed (apenas se banco vazio)
  console.log("\n┌─────────────────────────────────────────────────────────┐");
  console.log("│  PASSO 2: Seed (apenas se banco vazio)                  │");
  console.log("└─────────────────────────────────────────────────────────┘\n");

  await runScript(join(__dirname, "run-seed.mjs"), ["--if-empty"]);

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  POSTBUILD: Configuração do banco concluída");
  console.log("═══════════════════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("Erro fatal no postbuild-db:", err);
  // Não usa process.exit(1) para não interromper o deploy
});
