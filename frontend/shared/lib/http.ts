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

function isFormDataBody(body: BodyInit | null | undefined): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

export async function http<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  const usesCsrf = mutating(init.method) && !path.includes("/webhooks/");
  if (init.body && !headers.has("Content-Type") && !isFormDataBody(init.body)) {
    headers.set("Content-Type", "application/json");
  }
  if (usesCsrf) headers.set("x-csrf-token", await getCsrfToken());
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: "include" });
  if (
    response.status === 403 &&
    usesCsrf &&
    retry &&
    response.headers.get("x-csrf-retry") === "1"
  ) {
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
