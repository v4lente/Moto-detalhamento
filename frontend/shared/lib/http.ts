import { API_BASE } from "./api-config";

let csrfToken: string | null = null;

export async function getCsrfToken(force = false): Promise<string> {
  if (csrfToken && !force) return csrfToken;
  const response = await fetch(`${API_BASE}/security/csrf`, { credentials: "include", cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível iniciar a sessão segura");
  csrfToken = (await response.json()).token;
  return csrfToken!;
}

function mutating(method?: string) {
  return !["GET", "HEAD", "OPTIONS"].includes((method || "GET").toUpperCase());
}

export async function http<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (mutating(init.method) && !path.includes("/webhooks/")) headers.set("x-csrf-token", await getCsrfToken());
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: "include" });
  if (response.status === 403 && mutating(init.method) && retry) {
    csrfToken = null;
    return http<T>(path, init, false);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = body?.error;
    throw new Error(typeof error === "string" ? error : error?.message || body?.message || "Falha na requisição");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
