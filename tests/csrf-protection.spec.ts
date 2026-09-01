import { test, expect } from "@playwright/test";
import { issueCsrfToken } from "../backend/api/middleware/csrf";
test("token CSRF é estável na sessão", () => { const req: any = { session: {} }; const first = issueCsrfToken(req); expect(issueCsrfToken(req)).toBe(first); expect(first.length).toBeGreaterThan(20); });
