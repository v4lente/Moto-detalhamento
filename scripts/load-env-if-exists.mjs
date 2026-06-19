/**
 * Load .env into process.env when the file exists.
 * Compatible with Node versions that lack --env-file-if-exists.
 * Standalone copy for npm scripts (postbuild-db.mjs).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env");

export function loadEnvIfExists() {
  if (!fs.existsSync(envPath)) {
    return false;
  }

  const loadEnvFile = process.loadEnvFile;
  if (typeof loadEnvFile === "function") {
    try {
      loadEnvFile(envPath);
      return true;
    } catch {
      // fall through to manual parse
    }
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
  return true;
}
