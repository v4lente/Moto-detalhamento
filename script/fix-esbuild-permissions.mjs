#!/usr/bin/env node
/**
 * Fix esbuild binary permissions on Linux/Unix environments.
 * 
 * This script ensures that esbuild binaries have execute permissions,
 * which may be lost during npm install in restricted environments
 * (e.g., Hostinger, Docker, CI with restrictive umask).
 * 
 * IMPORTANT: This script FORCES chmod on all esbuild binaries found,
 * without checking if permissions are "already correct" - because
 * stat() can report incorrect permissions on some filesystems.
 * 
 * Safe to run on any platform - silently skips on Windows.
 */

import { chmod, access, readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { constants } from "fs";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const nodeModules = join(rootDir, "node_modules");

/**
 * Force chmod using Node.js API, with shell fallback
 */
async function forceChmod(filePath) {
  // Try Node.js chmod first
  try {
    await chmod(filePath, 0o755);
    return { success: true, method: "node" };
  } catch (nodeErr) {
    // Fallback to shell chmod
    try {
      execSync(`chmod +x "${filePath}"`, { stdio: "pipe" });
      return { success: true, method: "shell" };
    } catch (shellErr) {
      return { success: false, error: shellErr.message };
    }
  }
}

/**
 * Check if file exists
 */
async function fileExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Fix a single file - ALWAYS force chmod without checking current permissions
 */
async function fixFile(filePath) {
  if (!(await fileExists(filePath))) {
    return { found: false };
  }
  
  const result = await forceChmod(filePath);
  return { found: true, ...result };
}

/**
 * Fix all esbuild-related files in .bin directory
 */
async function fixBinDirectory() {
  const binDir = join(nodeModules, ".bin");
  const results = [];
  
  try {
    const files = await readdir(binDir);
    for (const file of files) {
      if (file.includes("esbuild")) {
        const filePath = join(binDir, file);
        const result = await fixFile(filePath);
        if (result.found) {
          results.push({ path: filePath, ...result });
        }
      }
    }
  } catch {
    // .bin directory may not exist
  }
  
  return results;
}

/**
 * Recursively scan for esbuild binaries
 */
async function scanForEsbuildBinaries(dir, depth = 0, results = []) {
  if (depth > 6) return results;
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // If this is a "bin" directory, check for esbuild binary
        if (entry.name === "bin") {
          const esbuildPath = join(fullPath, "esbuild");
          const result = await fixFile(esbuildPath);
          if (result.found) {
            results.push({ path: esbuildPath, ...result });
          }
        }
        // Recurse into relevant directories
        else if (
          entry.name === "@esbuild" ||
          entry.name === "esbuild" ||
          entry.name === "node_modules" ||
          entry.name.startsWith("linux-") ||
          entry.name.startsWith("darwin-")
        ) {
          await scanForEsbuildBinaries(fullPath, depth + 1, results);
        }
        // Check nested node_modules in packages that bundle esbuild
        else if (["vite", "tsx", "rollup", "esbuild-kit"].includes(entry.name)) {
          const nestedNodeModules = join(fullPath, "node_modules");
          await scanForEsbuildBinaries(nestedNodeModules, depth + 1, results);
        }
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  
  return results;
}

/**
 * Also try the exact known paths that commonly fail
 */
async function fixKnownPaths() {
  const knownPaths = [
    // Root esbuild
    "esbuild/bin/esbuild",
    "@esbuild/linux-x64/bin/esbuild",
    "@esbuild/linux-arm64/bin/esbuild",
    // Nested in vite
    "vite/node_modules/esbuild/bin/esbuild",
    "vite/node_modules/@esbuild/linux-x64/bin/esbuild",
    "vite/node_modules/@esbuild/linux-arm64/bin/esbuild",
    // Nested in tsx
    "tsx/node_modules/esbuild/bin/esbuild",
    "tsx/node_modules/@esbuild/linux-x64/bin/esbuild",
    // Nested in rollup
    "rollup/node_modules/esbuild/bin/esbuild",
    "rollup/node_modules/@esbuild/linux-x64/bin/esbuild",
  ];
  
  const results = [];
  
  for (const relativePath of knownPaths) {
    const fullPath = join(nodeModules, relativePath);
    const result = await fixFile(fullPath);
    if (result.found) {
      results.push({ path: fullPath, ...result });
    }
  }
  
  return results;
}

/**
 * Use shell find command as ultimate fallback
 */
function fixWithShellFind() {
  try {
    // Find all esbuild binaries and chmod them
    execSync(
      `find "${nodeModules}" -type f -name "esbuild" -path "*/bin/*" -exec chmod +x {} \\;`,
      { stdio: "pipe", timeout: 30000 }
    );
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function main() {
  // Skip on Windows
  if (process.platform === "win32") {
    console.log("Skipping esbuild permission fix on Windows.");
    return;
  }

  console.log("Fixing esbuild binary permissions (forced mode)...");
  
  const allResults = [];
  
  // 1. Fix .bin directory
  const binResults = await fixBinDirectory();
  allResults.push(...binResults);
  
  // 2. Fix known paths explicitly
  const knownResults = await fixKnownPaths();
  allResults.push(...knownResults);
  
  // 3. Scan recursively for any we might have missed
  const scanResults = await scanForEsbuildBinaries(nodeModules);
  allResults.push(...scanResults);
  
  // 4. Shell find as ultimate fallback
  console.log("Running shell find as fallback...");
  const shellResult = fixWithShellFind();
  
  // Report results
  const uniquePaths = [...new Set(allResults.map(r => r.path))];
  const successful = allResults.filter(r => r.success);
  const failed = allResults.filter(r => !r.success && r.found);
  
  console.log(`\nFound ${uniquePaths.length} esbuild binary location(s):`);
  for (const path of uniquePaths) {
    console.log(`  - ${path}`);
  }
  
  if (successful.length > 0) {
    console.log(`\n✓ Successfully fixed ${successful.length} binary permission(s)`);
  }
  
  if (failed.length > 0) {
    console.log(`\n⚠ Failed to fix ${failed.length} binary permission(s):`);
    for (const f of failed) {
      console.log(`  - ${f.path}: ${f.error}`);
    }
  }
  
  if (shellResult.success) {
    console.log("✓ Shell find fallback completed");
  } else {
    console.log(`⚠ Shell find fallback failed: ${shellResult.error}`);
  }
  
  console.log("\nPermission fix complete.");
}

main().catch((err) => {
  console.error("Error fixing esbuild permissions:", err.message);
  // Don't fail the build - this is a best-effort fix
  process.exit(0);
});
