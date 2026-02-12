#!/usr/bin/env node
/**
 * Fix esbuild binary permissions on Linux/Unix environments.
 * 
 * This script ensures that esbuild binaries have execute permissions,
 * which may be lost during npm install in restricted environments
 * (e.g., Hostinger, Docker, CI with restrictive umask).
 * 
 * Safe to run on any platform - silently skips on Windows.
 */

import { chmod, access, readdir, stat } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { constants } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const nodeModules = join(rootDir, "node_modules");

// Patterns for esbuild binaries that need execute permission
const esbuildBinaryPatterns = [
  // Direct esbuild installations
  "esbuild/bin/esbuild",
  // Platform-specific binaries (nested in @esbuild scope)
  "@esbuild/linux-x64/bin/esbuild",
  "@esbuild/linux-arm64/bin/esbuild",
  "@esbuild/darwin-x64/bin/esbuild",
  "@esbuild/darwin-arm64/bin/esbuild",
];

// Known locations where esbuild may be nested
const nestedLocations = [
  "", // root node_modules
  "vite/node_modules",
  "tsx/node_modules",
  "@esbuild-kit/core-utils/node_modules",
];

async function fileExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function fixPermission(filePath) {
  try {
    if (!(await fileExists(filePath))) {
      return false;
    }
    
    const fileStat = await stat(filePath);
    const currentMode = fileStat.mode;
    const executePermission = constants.S_IXUSR | constants.S_IXGRP | constants.S_IXOTH;
    
    // Check if execute permission is missing
    if ((currentMode & executePermission) !== executePermission) {
      // Add execute permission (0o755)
      await chmod(filePath, 0o755);
      console.log(`  Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (err) {
    // Silently ignore permission errors (may happen on Windows or restricted systems)
    if (err.code !== "EPERM" && err.code !== "ENOENT") {
      console.warn(`  Warning: Could not fix ${filePath}: ${err.message}`);
    }
    return false;
  }
}

async function fixBinDirectory() {
  const binDir = join(nodeModules, ".bin");
  let fixed = 0;
  
  try {
    const files = await readdir(binDir);
    for (const file of files) {
      if (file.includes("esbuild")) {
        const filePath = join(binDir, file);
        if (await fixPermission(filePath)) {
          fixed++;
        }
      }
    }
  } catch {
    // .bin directory may not exist
  }
  
  return fixed;
}

async function main() {
  // Skip on Windows (no execute permission concept in the same way)
  if (process.platform === "win32") {
    console.log("Skipping esbuild permission fix on Windows.");
    return;
  }

  console.log("Fixing esbuild binary permissions...");
  let totalFixed = 0;

  // Fix .bin directory symlinks/scripts
  totalFixed += await fixBinDirectory();

  // Fix all known esbuild binary locations
  for (const location of nestedLocations) {
    for (const pattern of esbuildBinaryPatterns) {
      const fullPath = join(nodeModules, location, pattern);
      if (await fixPermission(fullPath)) {
        totalFixed++;
      }
    }
  }

  if (totalFixed > 0) {
    console.log(`\nFixed ${totalFixed} esbuild binary permission(s).`);
  } else {
    console.log("All esbuild binaries already have correct permissions.");
  }
}

main().catch((err) => {
  console.error("Error fixing esbuild permissions:", err.message);
  // Don't fail the build - this is a best-effort fix
  process.exit(0);
});
