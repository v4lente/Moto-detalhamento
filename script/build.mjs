import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, stat, chmod, access, constants } from "fs/promises";
import { join } from "path";

// All npm dependencies are externalized — they are installed via `npm install`
// on the server and resolved from node_modules at runtime.
// This keeps the server bundle small (only application code).

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

async function fixEsbuildPermissions() {
  // Fix the exact path that fails on Hostinger
  const esbuildBinPath = join(process.cwd(), "node_modules/vite/node_modules/@esbuild/linux-x64/bin/esbuild");
  
  try {
    // Check if file exists
    await access(esbuildBinPath, constants.F_OK);
    // Set execute permissions (0o755)
    await chmod(esbuildBinPath, 0o755);
    console.log("✓ Fixed esbuild binary permissions");
  } catch (err) {
    // Silently ignore if file doesn't exist (Windows, or different platform)
    if (err.code !== "ENOENT") {
      console.warn(`⚠ Could not fix esbuild permissions: ${err.message}`);
    }
  }
}

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  // Fix esbuild permissions before building (critical for Hostinger Linux environment)
  await fixEsbuildPermissions();

  console.log("Building client...");
  await viteBuild();

  console.log("\nBuilding server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  
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
    entryPoints: ["server/index.ts"],
    platform: "node",
    target: "node20",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
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
    const bundleStat = await stat("dist/index.cjs");
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
