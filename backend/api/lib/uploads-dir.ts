import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function hasProjectMarkers(dir: string): boolean {
  return fs.existsSync(path.resolve(dir, "package.json"));
}

function resolveProjectRoot(moduleUrl: string): string {
  const moduleDir = path.dirname(fileURLToPath(moduleUrl));
  const candidates = unique([
    process.cwd(),
    path.resolve(moduleDir, ".."),
    path.resolve(moduleDir, "..", ".."),
  ]);

  const projectRoot = candidates.find(hasProjectMarkers);
  return projectRoot ?? process.cwd();
}

export function resolveUploadsDir(moduleUrl: string): string {
  const projectRoot = resolveProjectRoot(moduleUrl);
  return path.resolve(projectRoot, "public", "uploads");
}

export function ensureUploadsDir(moduleUrl: string): string {
  const uploadsDir = resolveUploadsDir(moduleUrl);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}
