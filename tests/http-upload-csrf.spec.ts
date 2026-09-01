import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { build } from "esbuild";

type HttpModule = typeof import("../frontend/shared/lib/http");

let bundledHttpUrl: string;

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function absoluteRequest(input: RequestInfo | URL, init?: RequestInit) {
  const rawUrl =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  return new Request(new URL(rawUrl, "http://app.test"), init);
}

async function loadHttp(): Promise<HttpModule> {
  return import(`${bundledHttpUrl}#${randomUUID()}`) as Promise<HttpModule>;
}

test.beforeAll(async () => {
  const result = await build({
    absWorkingDir: process.cwd(),
    entryPoints: [path.resolve("frontend/shared/lib/http.ts")],
    bundle: true,
    define: {
      "import.meta.env.VITE_API_BASE": JSON.stringify("/api"),
    },
    format: "esm",
    logLevel: "silent",
    outdir: "out",
    platform: "node",
    target: "node20.19",
    write: false,
  });
  const javascript = result.outputFiles.find((file) => file.path.endsWith(".js"));
  if (!javascript) throw new Error("Bundle do helper HTTP não foi gerado");
  bundledHttpUrl = `data:text/javascript;base64,${Buffer.from(javascript.contents).toString("base64")}`;
});

test("reprodução: FormData recebe CSRF e mantém boundary gerado pelo runtime", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Request[] = [];
  globalThis.fetch = async (input, init) => {
    const request = absoluteRequest(input, init);
    requests.push(request);
    if (request.url.endsWith("/security/csrf")) {
      return jsonResponse({ token: "csrf-upload" });
    }
    return jsonResponse({ filePath: "/uploads/test.jpg" });
  };

  try {
    const { http } = await loadHttp();
    const formData = new FormData();
    formData.append("file", new Blob(["image"], { type: "image/png" }), "test.png");

    await http<{ filePath: string }>("/uploads/local", {
      method: "POST",
      headers: { "x-trace-id": "trace-upload" },
      body: formData,
    });

    const upload = requests.find((request) => request.url.endsWith("/uploads/local"));
    expect(upload).toBeTruthy();
    expect(upload!.credentials).toBe("include");
    expect(upload!.headers.get("x-csrf-token")).toBe("csrf-upload");
    expect(upload!.headers.get("x-trace-id")).toBe("trace-upload");
    expect(upload!.headers.get("content-type")).toMatch(
      /^multipart\/form-data;\s*boundary=/,
    );
    const parsed = await upload!.formData();
    const file = parsed.get("file");
    expect(file).toBeTruthy();
    expect(typeof file).not.toBe("string");
    expect((file as File).name).toBe("test.png");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("regressão: JSON, ausência de body e headers explícitos permanecem estáveis", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Request[] = [];
  globalThis.fetch = async (input, init) => {
    const request = absoluteRequest(input, init);
    requests.push(request);
    if (request.url.endsWith("/security/csrf")) {
      return jsonResponse({ token: "csrf-json" });
    }
    return new Response(null, { status: 204 });
  };

  try {
    const { http } = await loadHttp();
    await http<void>("/settings", {
      method: "PATCH",
      headers: { "x-trace-id": "trace-json" },
      body: JSON.stringify({ enabled: true }),
    });
    await http<void>("/products/1", { method: "DELETE" });
    await http<void>("/custom", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "raw",
    });

    const mutationRequests = requests.filter(
      (request) => !request.url.endsWith("/security/csrf"),
    );
    expect(mutationRequests).toHaveLength(3);
    expect(mutationRequests[0].headers.get("content-type")).toBe("application/json");
    expect(mutationRequests[0].headers.get("x-trace-id")).toBe("trace-json");
    expect(mutationRequests[0].headers.get("x-csrf-token")).toBe("csrf-json");
    expect(await mutationRequests[0].text()).toBe('{"enabled":true}');
    expect(mutationRequests[1].headers.get("content-type")).toBeNull();
    expect(mutationRequests[2].headers.get("content-type")).toBe("text/plain");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("regressão: 403 marcado renova o token e repete somente uma vez", async () => {
  const originalFetch = globalThis.fetch;
  let csrfRequests = 0;
  const uploadTokens: Array<string | null> = [];
  globalThis.fetch = async (input, init) => {
    const request = absoluteRequest(input, init);
    if (request.url.endsWith("/security/csrf")) {
      csrfRequests += 1;
      return jsonResponse({ token: csrfRequests === 1 ? "old-token" : "new-token" });
    }
    uploadTokens.push(request.headers.get("x-csrf-token"));
    if (uploadTokens.length === 1) {
      return jsonResponse(
        { error: { code: "FORBIDDEN", message: "Token CSRF inválido" } },
        403,
        { "x-csrf-retry": "1" },
      );
    }
    return jsonResponse({ filePath: "/uploads/test.jpg" });
  };

  try {
    const { http } = await loadHttp();
    const formData = new FormData();
    formData.append("file", new Blob(["image"]), "test.png");
    await http<{ filePath: string }>("/uploads/local", {
      method: "POST",
      body: formData,
    });

    expect(uploadTokens).toEqual(["old-token", "new-token"]);
    expect(csrfRequests).toBe(2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("regressão: 403 sem marcador não repete a mutação", async () => {
  const originalFetch = globalThis.fetch;
  let csrfRequests = 0;
  let mutationRequests = 0;
  globalThis.fetch = async (input, init) => {
    const request = absoluteRequest(input, init);
    if (request.url.endsWith("/security/csrf")) {
      csrfRequests += 1;
      return jsonResponse({ token: "stable-token" });
    }
    mutationRequests += 1;
    return jsonResponse(
      { error: { code: "FORBIDDEN", message: "Sem permissão" } },
      403,
    );
  };

  try {
    const { http } = await loadHttp();
    await expect(
      http("/users", { method: "POST", body: JSON.stringify({}) }),
    ).rejects.toThrow("Sem permissão");
    expect(mutationRequests).toBe(1);
    expect(csrfRequests).toBe(1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("regressão: concorrência não transforma 403 sem marcador em replay", async () => {
  const originalFetch = globalThis.fetch;
  let csrfRequests = 0;
  const mutationCounts = new Map<string, number>();
  globalThis.fetch = async (input, init) => {
    const request = absoluteRequest(input, init);
    if (request.url.endsWith("/security/csrf")) {
      csrfRequests += 1;
      return jsonResponse({ token: csrfRequests === 1 ? "stale-token" : "fresh-token" });
    }

    const requestCase = request.headers.get("x-test-case")!;
    mutationCounts.set(requestCase, (mutationCounts.get(requestCase) ?? 0) + 1);
    if (requestCase === "denied") {
      return jsonResponse(
        { error: { code: "FORBIDDEN", message: "Sem permissão" } },
        403,
      );
    }
    if (request.headers.get("x-csrf-token") === "stale-token") {
      return jsonResponse(
        { error: { code: "FORBIDDEN", message: "Token CSRF inválido" } },
        403,
        { "x-csrf-retry": "1" },
      );
    }
    return jsonResponse({ ok: true });
  };

  try {
    const { getCsrfToken, http } = await loadHttp();
    await getCsrfToken(true);
    const results = await Promise.allSettled(
      ["upload-a", "upload-b", "denied"].map((requestCase) =>
        http("/uploads/local", {
          method: "POST",
          headers: { "x-test-case": requestCase },
          body: new FormData(),
        }),
      ),
    );

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(2);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(mutationCounts.get("upload-a")).toBe(2);
    expect(mutationCounts.get("upload-b")).toBe(2);
    expect(mutationCounts.get("denied")).toBe(1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

