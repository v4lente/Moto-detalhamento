import fs from "node:fs";
import path from "node:path";

export function resolveAppointmentBudgetsDir(
  env: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd(),
): string {
  const configured = env.PRIVATE_UPLOADS_DIR?.trim();
  if (configured) return path.resolve(cwd, configured, "appointment-budgets");
  if (env.NODE_ENV === "production") {
    throw new Error("PRIVATE_UPLOADS_DIR é obrigatória em produção");
  }
  return path.resolve(cwd, "backend/.runtime/appointment-budgets");
}

export function ensureAppointmentBudgetsDir(): string {
  const directory = resolveAppointmentBudgetsDir();
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}
