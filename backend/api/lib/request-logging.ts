const SENSITIVE_KEYS = /password|document|cipher|hash|token|secret|phone|email|address|customerName|customerEmail|customerPhone/i;

export function redactForLog(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => redactForLog(item, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, SENSITIVE_KEYS.test(key) ? "[redacted]" : redactForLog(item, depth + 1)]));
  }
  return typeof value === "string" && value.length > 200 ? `${value.slice(0, 200)}…` : value;
}

export function requestCorrelationId(req: { get(name: string): string | undefined }) {
  return req.get("x-request-id") || crypto.randomUUID();
}
