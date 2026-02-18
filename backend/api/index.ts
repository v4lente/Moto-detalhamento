import express, { type Request, Response, NextFunction } from "express";
import { registerAllRoutes } from "./routes/index";
import { serveStatic } from "./static";
import { createServer } from "http";
import { runMigrations } from "../infrastructure/db";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Serve attached assets as /assets
import path from "path";
app.use("/assets", express.static(path.resolve(process.cwd(), "attached_assets")));

// Serve uploaded images from public/uploads/
app.use("/uploads", express.static(path.resolve(process.cwd(), "public/uploads")));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

const trackedEnvVars = [
  "NODE_ENV",
  "PORT",
  "SESSION_SECRET",
  "DATABASE_URL",
  "BASE_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
] as const;

function getDatabaseUrlDiagnostics() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return {
      present: false,
      valid: false,
    };
  }

  try {
    const parsed = new URL(databaseUrl);
    const databaseName = parsed.pathname.replace(/^\//, "");
    return {
      present: true,
      valid: true,
      protocol: parsed.protocol,
      host: parsed.hostname,
      port: parsed.port || "(default)",
      database: databaseName || "(empty)",
      hasUsername: parsed.username.length > 0,
      hasPassword: parsed.password.length > 0,
    };
  } catch {
    return {
      present: true,
      valid: false,
    };
  }
}

function logStartupEnvironmentDiagnostics() {
  const relatedEnvKeys = Object.keys(process.env)
    .filter((key) => /(SESSION|DATABASE|STRIPE|BASE_URL|NODE_ENV|PORT)/i.test(key))
    .sort();

  const tracked = Object.fromEntries(
    trackedEnvVars.map((key) => {
      const value = process.env[key];
      return [
        key,
        {
          present: typeof value === "string" && value.length > 0,
          length: typeof value === "string" ? value.length : 0,
        },
      ];
    }),
  );

  const diagnostics = {
    runtime: {
      node: process.version,
      pid: process.pid,
      cwd: process.cwd(),
      argv1: process.argv[1] || "(unknown)",
    },
    tracked,
    relatedEnvKeys,
    databaseUrl: getDatabaseUrlDiagnostics(),
  };

  console.log("=".repeat(60));
  console.log("STARTUP ENV DIAGNOSTICS (safe)");
  console.log("No secret values are printed, only presence/shape metadata.");
  console.log(JSON.stringify(diagnostics, null, 2));
  console.log("=".repeat(60));
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  logStartupEnvironmentDiagnostics();

  // Run migrations with error handling - don't crash the server if migrations fail
  // Migrations also run during postbuild, so this is a safety net
  try {
    await runMigrations();
  } catch (migrationError: any) {
    console.error("=".repeat(60));
    console.error("MIGRATION ERROR - Server will start but may be degraded");
    console.error("=".repeat(60));
    
    // Identify the type of error for easier debugging
    if (migrationError.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("DATABASE AUTH ERROR: Check DATABASE_URL credentials");
      console.error("- Verify user/password in Hostinger hPanel");
      console.error("- Use 127.0.0.1 instead of localhost");
      console.error("- URL-encode special characters in password");
    } else if (migrationError.code === 'ECONNREFUSED') {
      console.error("DATABASE CONNECTION ERROR: Cannot reach MySQL server");
      console.error("- Check if MySQL is running");
      console.error("- Verify host and port in DATABASE_URL");
    } else if (migrationError.code === 'ER_BAD_DB_ERROR') {
      console.error("DATABASE NOT FOUND: The specified database does not exist");
      console.error("- Create the database in Hostinger hPanel");
    } else {
      console.error("Error details:", migrationError.message);
    }
    
    console.error("=".repeat(60));
    // Continue starting the server - it may work for cached/static content
    // or the database issue may be transient
  }

  await registerAllRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
