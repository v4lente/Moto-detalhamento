import { test, expect, type Page, type Route } from "@playwright/test";
import path from "node:path";
import { build } from "esbuild";

interface NetworkEvent {
  kind: "csrf" | "upload";
  csrfToken?: string;
  contentType?: string;
  fileName?: string;
}

let hookBundle: string;
let imageUploadBundle: string;

async function bundleHarness(name: string, source: string) {
  const result = await build({
    stdin: {
      contents: source,
      loader: "tsx",
      resolveDir: process.cwd(),
      sourcefile: `${name}.tsx`,
    },
    absWorkingDir: process.cwd(),
    alias: {
      "@": path.resolve("frontend"),
      "@shared": path.resolve("shared"),
    },
    bundle: true,
    define: {
      "import.meta.env.VITE_API_BASE": JSON.stringify("/api"),
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
    format: "iife",
    jsx: "automatic",
    loader: {
      ".css": "css",
      ".jpeg": "dataurl",
      ".jpg": "dataurl",
      ".png": "dataurl",
      ".svg": "dataurl",
    },
    logLevel: "silent",
    outdir: "out",
    platform: "browser",
    write: false,
  });
  const javascript = result.outputFiles.find((file) => file.path.endsWith(".js"));
  if (!javascript) throw new Error(`Bundle ${name} não foi gerado`);
  return javascript.text;
}

async function captureUpload(route: Route, events: NetworkEvent[]) {
  const request = route.request();
  const body = request.postDataBuffer();
  const parsed = await new Request(request.url(), {
    method: "POST",
    headers: request.headers(),
    body: body ?? undefined,
  }).formData();
  const file = parsed.get("file");
  events.push({
    kind: "upload",
    csrfToken: request.headers()["x-csrf-token"],
    contentType: request.headers()["content-type"],
    fileName: typeof file === "string" || !file ? undefined : file.name,
  });
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ filePath: "/uploads/test.jpg" }),
  });
}

async function openHarness(page: Page, script: string, events: NetworkEvent[]) {
  await page.route("http://app.test/harness", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: '<!doctype html><html><body><div id="root"></div></body></html>',
    });
  });
  await page.route("http://app.test/api/security/csrf", async (route) => {
    events.push({ kind: "csrf" });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ token: "client-token" }),
    });
  });
  await page.route("http://app.test/api/uploads/local", async (route) => {
    await captureUpload(route, events);
  });
  await page.goto("http://app.test/harness");
  await page.addScriptTag({ content: script });
}

function expectSecureUpload(events: NetworkEvent[], expectedFileName: string) {
  expect(events.map((event) => event.kind)).toEqual(["csrf", "upload"]);
  const upload = events.find((event) => event.kind === "upload")!;
  expect(upload.csrfToken).toBe("client-token");
  expect(upload.contentType).toMatch(/^multipart\/form-data;\s*boundary=/);
  expect(upload.fileName).toBe(expectedFileName);
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  hookBundle = await bundleHarness(
    "use-upload-harness",
    `
      import React from "react";
      import { createRoot } from "react-dom/client";
      import { useUpload } from "./frontend/shared/hooks/use-upload";

      function Probe() {
        const { uploadFile } = useUpload({
          onSuccess: ({ filePath }) => { document.body.dataset.uploadResult = filePath; },
        });
        return (
          <button
            id="upload-hook"
            onClick={() => uploadFile(new File(["image"], "hook.png", { type: "image/png" }))}
          >
            upload
          </button>
        );
      }

      createRoot(document.getElementById("root")).render(<Probe />);
    `,
  );
  imageUploadBundle = await bundleHarness(
    "image-upload-harness",
    `
      import React from "react";
      import { createRoot } from "react-dom/client";
      import { ImageUpload } from "./frontend/shared/components/ImageUpload";

      createRoot(document.getElementById("root")).render(
        <ImageUpload
          value=""
          onChange={(filePath) => { document.body.dataset.uploadResult = filePath; }}
        />,
      );
    `,
  );
});

test("reprodução: useUpload envia multipart pelo transporte CSRF", async ({ page }) => {
  const events: NetworkEvent[] = [];
  await openHarness(page, hookBundle, events);

  await Promise.all([
    page.waitForResponse("**/api/uploads/local"),
    page.locator("#upload-hook").click(),
  ]);

  await expect(page.locator("body")).toHaveAttribute(
    "data-upload-result",
    "/uploads/test.jpg",
  );
  expectSecureUpload(events, "hook.png");
});

test("reprodução: ImageUpload envia o recorte pelo transporte CSRF", async ({ page }) => {
  const events: NetworkEvent[] = [];
  await openHarness(page, imageUploadBundle, events);
  await page.locator('input[type="file"]').setInputFiles({
    name: "image-upload.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nWQAAAAASUVORK5CYII=",
      "base64",
    ),
  });

  const confirm = page.getByRole("button", { name: "Confirmar Recorte" });
  await expect(confirm).toBeEnabled();
  await Promise.all([
    page.waitForResponse("**/api/uploads/local"),
    confirm.click(),
  ]);

  await expect(page.locator("body")).toHaveAttribute(
    "data-upload-result",
    "/uploads/test.jpg",
  );
  expectSecureUpload(events, "image-upload.png");
});

