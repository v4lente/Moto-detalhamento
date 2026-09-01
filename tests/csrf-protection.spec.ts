import { test, expect } from "@playwright/test";
import { csrfProtection, issueCsrfToken } from "../backend/api/middleware/csrf";

interface CsrfScenario {
  expectedToken?: string;
  suppliedToken?: string;
  origin?: string;
}

function executeCsrf({
  expectedToken,
  suppliedToken,
  origin = "https://app.test",
}: CsrfScenario) {
  let statusCode: number | undefined;
  let payload: unknown;
  let nextCalled = false;
  const responseHeaders = new Headers();
  const request = {
    session: expectedToken ? { csrfToken: expectedToken } : {},
    originalUrl: "/api/uploads/local",
    method: "POST",
    protocol: "https",
    body: {},
    get(name: string) {
      const header = name.toLowerCase();
      if (header === "host") return "app.test";
      if (header === "origin") return origin;
      if (header === "x-csrf-token") return suppliedToken;
      return undefined;
    },
  };
  const response = {
    set(name: string, value: string) {
      responseHeaders.set(name, value);
      return response;
    },
    setHeader(name: string, value: string) {
      responseHeaders.set(name, value);
      return response;
    },
    status(code: number) {
      statusCode = code;
      return response;
    },
    json(body: unknown) {
      payload = body;
      return response;
    },
  };

  csrfProtection(request as never, response as never, () => {
    nextCalled = true;
  });

  return { statusCode, payload, nextCalled, responseHeaders };
}

test("token CSRF é estável na sessão", () => {
  const request = { session: {} } as never;
  const first = issueCsrfToken(request);
  expect(issueCsrfToken(request)).toBe(first);
  expect(first.length).toBeGreaterThan(20);
});

test("falhas de token ausente e inválido autorizam uma renovação", () => {
  const missing = executeCsrf({ expectedToken: "known-token" });
  const invalid = executeCsrf({
    expectedToken: "known-token",
    suppliedToken: "wrong-token",
  });

  expect(missing.statusCode).toBe(403);
  expect(missing.responseHeaders.get("x-csrf-retry")).toBe("1");
  expect(invalid.statusCode).toBe(403);
  expect(invalid.responseHeaders.get("x-csrf-retry")).toBe("1");
});

test("origem inválida não autoriza replay", () => {
  const result = executeCsrf({
    expectedToken: "known-token",
    suppliedToken: "known-token",
    origin: "https://evil.test",
  });

  expect(result.statusCode).toBe(403);
  expect(result.responseHeaders.get("x-csrf-retry")).toBeNull();
  expect(result.nextCalled).toBe(false);
});

test("token correto avança sem marcador de retry", () => {
  const result = executeCsrf({
    expectedToken: "known-token",
    suppliedToken: "known-token",
  });

  expect(result.statusCode).toBeUndefined();
  expect(result.payload).toBeUndefined();
  expect(result.responseHeaders.get("x-csrf-retry")).toBeNull();
  expect(result.nextCalled).toBe(true);
});
