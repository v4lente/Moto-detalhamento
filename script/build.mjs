import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, stat, chmod, access, readdir, constants } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

// All npm dependencies are externalized — they are installed via `npm install`
// on the server and resolved from node_modules at runtime.
// This keeps the server bundle small (only application code).

// Calculate root directory based on script location (not process.cwd())
// This ensures correct paths even when script is executed from different directories
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

/**
 * Force chmod using Node.js API, with shell fallback.
 * ALWAYS forces chmod without checking current permissions.
 */
async function forceChmod(filePath) {
  try {
    await chmod(filePath, 0o755);
    return true;
  } catch {
    try {
      execSync(`chmod +x "${filePath}"`, { stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Fix esbuild binary permissions - FORCED mode.
 * Does not check if permissions are "already correct" because stat() 
 * can report incorrect values on some filesystems (like Hostinger).
 */
async function fixEsbuildPermissions() {
  // Skip on Windows
  if (process.platform === "win32") {
    return;
  }

  const nodeModules = join(rootDir, "node_modules");
  let fixedCount = 0;

  // Known paths that commonly need fixing
  const knownPaths = [
    ".bin/esbuild",
    "esbuild/bin/esbuild",
    "@esbuild/linux-x64/bin/esbuild",
    "@esbuild/linux-arm64/bin/esbuild",
    "vite/node_modules/esbuild/bin/esbuild",
    "vite/node_modules/@esbuild/linux-x64/bin/esbuild",
    "vite/node_modules/@esbuild/linux-arm64/bin/esbuild",
    "tsx/node_modules/esbuild/bin/esbuild",
    "tsx/node_modules/@esbuild/linux-x64/bin/esbuild",
  ];

  console.log("Fixing esbuild binary permissions (forced)...");

  // Fix all known paths
  for (const relativePath of knownPaths) {
    const fullPath = join(nodeModules, relativePath);
    try {
      await access(fullPath, constants.F_OK);
      if (await forceChmod(fullPath)) {
        console.log(`  Fixed: ${relativePath}`);
        fixedCount++;
      }
    } catch {
      // File doesn't exist
    }
  }

  // Shell find as ultimate fallback
  try {
    execSync(
      `find "${nodeModules}" -type f -name "esbuild" -path "*/bin/*" -exec chmod +x {} \\;`,
      { stdio: "pipe", timeout: 30000 }
    );
    console.log("  Shell find fallback completed");
  } catch {
    // Ignore errors
  }

  console.log(`✓ Forced chmod on ${fixedCount} known esbuild path(s)`);
}

async function buildAll() {
  await rm(join(rootDir, "dist"), { recursive: true, force: true });

  // Fix esbuild permissions before building (critical for Hostinger Linux environment)
  await fixEsbuildPermissions();

  console.log("Building client...");
  await viteBuild();

  console.log("\nBuilding server...");
  const pkg = JSON.parse(await readFile(join(rootDir, "package.json"), "utf-8"));
  
  // Externalize all npm dependencies to keep bundle small
  // This is critical for Hostinger deployment which has bundle size limits
  const externals = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
    ...Object.keys(pkg.optionalDependencies || {}),
    // Also externalize Node.js built-in modules
    "path", "fs", "http", "https", "crypto", "util", "stream", "events",
    "buffer", "url", "querystring", "os", "child_process", "net", "tls",
    "dns", "dgram", "cluster", "readline", "repl", "vm", "zlib", "assert",
    "tty", "domain", "constants", "module", "process", "v8", "async_hooks",
    "http2", "perf_hooks", "worker_threads", "inspector",
  ];

  await esbuild({
    entryPoints: [join(rootDir, "server/index.ts")],
    platform: "node",
    target: "node20",
    bundle: true,
    format: "cjs",
    outfile: join(rootDir, "dist/index.js"),
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    minifyWhitespace: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    treeShaking: true,
    external: externals,
    logLevel: "info",
    // Optimize for smaller bundle size
    legalComments: "none",
    drop: ["debugger"],
    pure: ["console.debug"],
    keepNames: false,
    sourcemap: false,
    metafile: true,
  });

  // Report bundle size
  try {
    const bundleStat = await stat(join(rootDir, "dist/index.js"));
    console.log(`\n✓ Server bundle size: ${formatBytes(bundleStat.size)}`);
    
    // Warn if bundle is getting large (Hostinger limit consideration)
    if (bundleStat.size > 5 * 1024 * 1024) {
      console.warn("⚠ Warning: Bundle size exceeds 5MB. Consider further optimization.");
    } else if (bundleStat.size > 2 * 1024 * 1024) {
      console.log("ℹ Note: Bundle size is moderate. Monitor for growth.");
    } else {
      console.log("✓ Bundle size is optimal for deployment.");
    }
  } catch {
    // Ignore stat errors
  }

  console.log("\n✓ Build completed successfully!");
}

buildAll().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
