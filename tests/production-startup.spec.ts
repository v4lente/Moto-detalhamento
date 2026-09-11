import { test, expect } from "@playwright/test";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import http from "node:http";
import path from "node:path";

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return reject(new Error("Não foi possível obter uma porta livre"));
      const port = address.port;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

function waitForStartup(child: ChildProcessWithoutNullStreams, port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = "";
    let settled = false;
    let timeout: ReturnType<typeof setTimeout>;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback();
    };
    const onData = (chunk: Buffer) => {
      output += chunk.toString();
      if (output.includes(`serving on port ${port}`)) finish(() => resolve(output));
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.once("error", (error) => finish(() => reject(error)));
    child.once("exit", (code, signal) => finish(() => reject(new Error(`Processo encerrou antes do listen: code=${code}, signal=${signal}\n${output}`))));
    timeout = setTimeout(() => finish(() => reject(new Error(`Timeout aguardando listen\n${output}`))), 30_000);
  });
}

function getStatusCode(port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const request = http.get({ hostname: "127.0.0.1", port, path: "/", timeout: 5_000 }, (response) => {
      response.resume();
      response.once("end", () => resolve(response.statusCode || 0));
    });
    request.once("error", reject);
    request.once("timeout", () => request.destroy(new Error("Timeout no smoke check")));
  });
}

async function stopProcess(child: ChildProcessWithoutNullStreams): Promise<void> {
  if (child.exitCode !== null) return;
  await new Promise<void>((resolve) => {
    const done = () => resolve();
    child.once("exit", done);
    child.kill("SIGTERM");
    if (child.exitCode !== null) resolve();
  });
}

test.describe("bootstrap de produção", () => {
  test("não derruba o processo sem PRIVATE_UPLOADS_DIR", async () => {
    const port = await findFreePort();
    const environment = { ...process.env, NODE_ENV: "production", PORT: String(port) };
    delete environment.PRIVATE_UPLOADS_DIR;
    const entrypoint = process.env.PRODUCTION_STARTUP_ENTRYPOINT || "dist/index.js";
    const entrypointArgs = entrypoint.endsWith(".ts")
      ? ["--import", "tsx", entrypoint]
      : [entrypoint];
    const child = spawn(process.execPath, entrypointArgs, {
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
    });

    try {
      await waitForStartup(child, port);
      await expect.poll(() => getStatusCode(port), { timeout: 5_000 }).toBe(200);
    } finally {
      await stopProcess(child);
    }
  });

  test("mantém o armazenamento privado obrigatório para operações de orçamento", async () => {
    const { resolveAppointmentBudgetsDir } = await import("../backend/api/lib/private-uploads-dir");
    expect(() => resolveAppointmentBudgetsDir({ NODE_ENV: "production" }, "C:/app")).toThrow(/PRIVATE_UPLOADS_DIR/);
    expect(resolveAppointmentBudgetsDir({ NODE_ENV: "production", PRIVATE_UPLOADS_DIR: "private" }, "C:/app"))
      .toBe(path.resolve("C:/app", "private/appointment-budgets"));
  });
});
