import { Hono } from "hono";
import { cors } from "hono/cors";
import type Database from "better-sqlite3";
import type { MiddlewareHandler } from "hono";
import { commentRoutes } from "./routes/comments.js";
import { authRoutes } from "./routes/auth.js";
import { testPageRoute } from "./routes/test-page.js";
import { sessionMiddleware } from "./middleware/session.js";
import type { AppEnv } from "./types.js";
import type { Configuration } from "./config.js";
import { createProviders, type ProviderName, type ProviderInstance } from "./auth/providers.js";

function createBaseApp(db: Database.Database, config: Configuration): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.use("*", async (c, next) => {
    c.set("db", db);
    await next();
  });

  app.use(
    "*",
    cors({
      origin: config.corsOrigin,
      credentials: true,
      allowMethods: ["GET", "POST", "DELETE"],
      allowHeaders: ["Content-Type"],
    })
  );

  return app;
}

function mountRoutes(
  app: Hono<AppEnv>,
  config: Configuration,
  providers: Map<ProviderName, ProviderInstance>
) {
  app.route(
    "/",
    authRoutes({
      providers,
      blogUrl: config.blogUrl,
      secureCookies: config.secureCookies,
      sessionDurationDays: config.sessionDurationDays,
    })
  );
  app.route("/", commentRoutes());
  app.route("/", testPageRoute());
  app.get("/health", (c) => c.json({ ok: true }));
}

export function createApp(db: Database.Database, config: Configuration) {
  const app = createBaseApp(db, config);
  app.use("*", sessionMiddleware());
  mountRoutes(app, config, createProviders(config));
  return app;
}

export interface TestAppOptions {
  authMiddleware?: MiddlewareHandler;
  providers?: Map<ProviderName, ProviderInstance>;
}

export function createTestApp(
  db: Database.Database,
  config: Configuration,
  options: TestAppOptions = {}
) {
  const app = createBaseApp(db, config);

  if (options.authMiddleware) {
    app.use("*", options.authMiddleware);
  } else {
    app.use("*", sessionMiddleware());
  }

  mountRoutes(app, config, options.providers ?? new Map());
  return app;
}
