import { Hono } from "hono";
import { cors } from "hono/cors";
import type Database from "better-sqlite3";
import type { MiddlewareHandler } from "hono";
import { commentRoutes } from "./routes/comments.js";
import { testPageRoute } from "./routes/test-page.js";
import type { AppEnv } from "./types.js";

export function createApp(
  db: Database.Database,
  options?: {
    authMiddleware?: MiddlewareHandler;
    corsOrigin?: string;
  }
) {
  const app = new Hono<AppEnv>();

  // Inject database into context
  app.use("*", async (c, next) => {
    c.set("db", db);
    await next();
  });

  // CORS
  app.use(
    "*",
    cors({
      origin: options?.corsOrigin ?? "https://zkmarek.com",
      credentials: true,
      allowMethods: ["GET", "POST", "DELETE"],
      allowHeaders: ["Content-Type"],
    })
  );

  // Auth middleware (real or stub)
  if (options?.authMiddleware) {
    app.use("*", options.authMiddleware);
  }

  // Routes
  app.route("/", commentRoutes());
  app.route("/", testPageRoute());

  // Health check
  app.get("/health", (c) => c.json({ ok: true }));

  return app;
}
