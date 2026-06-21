import fs from "fs";
import path from "path";

type UploadsEnv = Record<string, string | undefined>;

function resolvePublicUploadsDir(cwd = process.cwd()): string {
  return path.resolve(cwd, "public/uploads");
}

function uniqueDirs(dirs: string[]): string[] {
  return Array.from(new Set(dirs.map((dir) => path.resolve(dir))));
}

export function resolveUploadsWriteDir(
  env: UploadsEnv = process.env,
  cwd = process.cwd(),
): string {
  const configuredDir = env.UPLOADS_DIR?.trim();

  if (configuredDir) {
    return path.resolve(cwd, configuredDir);
  }

  return resolvePublicUploadsDir(cwd);
}

export function resolveUploadsReadDirs(
  env: UploadsEnv = process.env,
  cwd = process.cwd(),
): string[] {
  return uniqueDirs([
    resolveUploadsWriteDir(env, cwd),
    resolvePublicUploadsDir(cwd),
  ]);
}

export function ensureUploadsWriteDir(
  env: UploadsEnv = process.env,
  cwd = process.cwd(),
): string {
  const uploadsDir = resolveUploadsWriteDir(env, cwd);

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  return uploadsDir;
}

export const resolveUploadsDir = resolveUploadsWriteDir;
export const ensureUploadsDir = ensureUploadsWriteDir;
