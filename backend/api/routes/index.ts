import type { Express } from "express";
import type { Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import helmet from "helmet";
import { generalLimiter } from "../middleware/auth";

// Import all route modules
import { registerHealthRoutes } from "./health.routes";
import { registerAuthRoutes } from "./auth.routes";
import { registerProductsRoutes } from "./products.routes";
import { registerOrdersRoutes } from "./orders.routes";
import { registerAppointmentsRoutes } from "./appointments.routes";
import { registerServicesRoutes } from "./services.routes";
import { registerCustomersRoutes } from "./customers.routes";
import { registerUsersRoutes } from "./users.routes";
import { registerUploadsRoutes } from "./uploads.routes";
import { registerSettingsRoutes } from "./settings.routes";

/**
 * Register all API routes
 */
export async function registerAllRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const MemStore = MemoryStore(session);
  
  // Trust proxy for production (Replit uses reverse proxy)
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  // Security headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://api.stripe.com", "https://vitals.vercel-insights.com"],
        frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));

  // General rate limiting for all API routes
  app.use("/api", generalLimiter);

  // Validate SESSION_SECRET in production
  const sessionSecret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && !sessionSecret) {
    throw new Error("SESSION_SECRET environment variable is required in production");
  }
  
  app.use(
    session({
      secret: sessionSecret || "dev-only-secret-not-for-production",
      resave: false,
      saveUninitialized: false,
      store: new MemStore({ checkPeriod: 86400000 }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      },
    })
  );

  // Register all route modules
  registerHealthRoutes(app);
  registerAuthRoutes(app);
  registerProductsRoutes(app);
  registerOrdersRoutes(app);
  registerAppointmentsRoutes(app);
  registerServicesRoutes(app);
  registerCustomersRoutes(app);
  registerUsersRoutes(app);
  registerUploadsRoutes(app);
  registerSettingsRoutes(app);

  return httpServer;
}
