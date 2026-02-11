import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { metaImagesPlugin } from "./vite-plugin-meta-images";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    metaImagesPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 800,
    target: "es2020",
    minify: "esbuild",
    cssMinify: true,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        // Improved code splitting strategy
        manualChunks(id) {
          // React core - must be first and standalone
          if (id.includes("node_modules/react-dom/")) {
            return "react-vendor";
          }
          if (id.includes("node_modules/react/")) {
            return "react-vendor";
          }
          // Radix UI components (heavy)
          if (id.includes("@radix-ui")) {
            return "radix-ui";
          }
          // Form libraries
          if (id.includes("react-hook-form") || id.includes("@hookform")) {
            return "forms";
          }
          // Charts (recharts is heavy)
          if (id.includes("recharts") || id.includes("d3-")) {
            return "charts";
          }
          // Animation libraries
          if (id.includes("framer-motion")) {
            return "animation";
          }
          // Date utilities
          if (id.includes("date-fns") || id.includes("react-day-picker")) {
            return "date-utils";
          }
          // Stripe
          if (id.includes("stripe")) {
            return "stripe";
          }
          // Uppy file upload
          if (id.includes("@uppy")) {
            return "uppy";
          }
          // TanStack Query
          if (id.includes("@tanstack")) {
            return "tanstack";
          }
          // Zod validation (used by both client and shared)
          if (id.includes("node_modules/zod")) {
            return "validation";
          }
        },
        // Optimize chunk file names
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom"],
    exclude: ["@uppy/core", "@uppy/dashboard"],
  },
});
