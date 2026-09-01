export type ApiErrorCode =
  | "VALIDATION_ERROR" | "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND"
  | "CONFLICT" | "PROFILE_INCOMPLETE" | "PRICE_CHANGED" | "OUT_OF_STOCK"
  | "PAYMENT_DISABLED" | "IDEMPOTENCY_CONFLICT" | "INVALID_TRANSITION" | "DOCUMENT_UNAVAILABLE" | "INTERNAL_ERROR";

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: ApiErrorCode, message: string, public readonly details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

export function sendApiError(res: any, error: unknown, fallback = "Erro interno do servidor") {
  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) } });
  }
  console.error(error);
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: fallback } });
}
