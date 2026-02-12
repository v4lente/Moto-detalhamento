import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, stat, chmod, access, readdir, constants } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

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
 * Recursively find and fix permissions for all esbuild binaries under node_modules.
 * This handles different npm hoisting scenarios (nested in vite, tsx, or at root).
 */
async function fixEsbuildPermissions() {
  // Skip on Windows (no execute permission concept)
  if (process.platform === "win32") {
    return;
  }

  const nodeModules = join(rootDir, "node_modules");
  let fixedCount = 0;

  async function fixFile(filePath) {
    try {
      await access(filePath, constants.F_OK);
      const fileStat = await stat(filePath);
      const executePermission = constants.S_IXUSR | constants.S_IXGRP | constants.S_IXOTH;
      
      if ((fileStat.mode & executePermission) !== executePermission) {
        await chmod(filePath, 0o755);
        console.log(`  Fixed: ${filePath}`);
        fixedCount++;
      }
    } catch {
      // File doesn't exist or can't be accessed
    }
  }

  async function scanDir(dir, depth = 0) {
    if (depth > 5) return; // Prevent infinite recursion
    
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Check for esbuild binary in bin subdirectory
          if (entry.name === "bin") {
            await fixFile(join(fullPath, "esbuild"));
          }
          // Recurse into @esbuild scope and node_modules
          else if (entry.name === "@esbuild" || entry.name === "esbuild" || entry.name === "node_modules") {
            await scanDir(fullPath, depth + 1);
          }
          // Check nested node_modules in common packages that bundle esbuild
          else if (["vite", "tsx", "esbuild-kit"].includes(entry.name)) {
            const nestedNodeModules = join(fullPath, "node_modules");
            await scanDir(nestedNodeModules, depth + 1);
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
  }

  console.log("Fixing esbuild binary permissions...");
  
  // Fix .bin directory symlinks
  const binDir = join(nodeModules, ".bin");
  await fixFile(join(binDir, "esbuild"));
  
  // Scan for all esbuild binaries
  await scanDir(nodeModules);

  if (fixedCount > 0) {
    console.log(`✓ Fixed ${fixedCount} esbuild binary permission(s)`);
  } else {
    console.log("✓ All esbuild binaries already have correct permissions");
  }
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
