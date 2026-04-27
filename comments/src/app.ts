import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { mkdirSync } from "fs";
import { dirname } from "path";
import type Database from "better-sqlite3";
import type { MiddlewareHandler } from "hono";
import { commentRoutes } from "./routes/comments.js";
import { authRoutes } from "./routes/auth.js";
import { testPageRoute } from "./routes/test-page.js";
import { subscribeRoutes } from "./routes/subscribe.js";
import { sessionMiddleware } from "./middleware/session.js";
import type { AppEnv } from "./types.js";
import type { Configuration } from "./config.js";
import { initDb } from "./db/index.js";
import { createProviders, type ProviderName, type ProviderInstance } from "./auth/providers.js";
import {
  ResendEmailClient,
  ConsoleEmailClient,
  type EmailClient,
} from "./email/emailClient.js";
import { devAuthRoutes } from "./routes/dev-auth.js";
import { devEmailRoutes } from "./routes/dev-emails.js";

export abstract class BaseApp {
  readonly app: Hono<AppEnv>;

  constructor(
    readonly db: Database.Database,
    readonly config: Configuration,
    readonly providers: Map<ProviderName, ProviderInstance> = new Map(),
    readonly emailClient?: EmailClient
  ) {
    this.app = new Hono<AppEnv>();

    this.app.use("*", async (c, next) => {
      c.set("db", this.db);
      await next();
    });

    this.app.use(
      "*",
      cors({
        origin: this.config.corsOrigin,
        credentials: true,
        allowMethods: ["GET", "POST", "DELETE"],
        allowHeaders: ["Content-Type"],
      })
    );

    this.app.use("*", sessionMiddleware());
  }

  protected abstract beforeMountRoutes(): void;

  protected mountRoutes(): void {
    this.app.route(
      "/",
      authRoutes({
        providers: this.providers,
        blogUrl: this.config.blogUrl,
        secureCookies: this.config.secureCookies,
        sessionDurationDays: this.config.sessionDurationDays,
      })
    );

    this.app.route("/", commentRoutes());
    this.app.route("/", testPageRoute());

    if (this.emailClient) {
      this.app.route(
        "/",
        subscribeRoutes({
          emailClient: this.emailClient,
          blogUrl: this.config.blogUrl,
          callbackBase: this.config.oauthCallbackBase,
          contentDir: this.config.contentDir,
        })
      );
    }

    this.app.get("/health", (c) => c.json({ ok: true }));
  }

  run(): void {
    serve({ fetch: this.app.fetch, port: this.config.port }, (info) => {
      console.log(`Comment server running at http://localhost:${info.port}`);
      console.log(`Test page: http://localhost:${info.port}/test`);
    });
  }
}

export class ProdApp extends BaseApp {
  constructor(
    db: Database.Database,
    config: Configuration,
    providers: Map<ProviderName, ProviderInstance>,
    emailClient?: EmailClient
  ) {
    super(db, config, providers, emailClient);
    this.beforeMountRoutes();
    this.mountRoutes();
  }

  protected beforeMountRoutes(): void {}
}

export class DevApp extends BaseApp {
  constructor(
    db: Database.Database,
    config: Configuration,
    providers: Map<ProviderName, ProviderInstance>,
    emailClient?: EmailClient
  ) {
    super(db, config, providers, emailClient);
    this.beforeMountRoutes();
    this.mountRoutes();
  }

  protected beforeMountRoutes(): void {
    // Dev-specific: override providers list to include "dev"
    this.app.get("/auth/providers", (c) =>
      c.json({ providers: [...Array.from(this.providers.keys()), "dev"] })
    );

    // Dev auth routes must be mounted before parameterized auth routes
    this.app.route(
      "/",
      devAuthRoutes({
        blogUrl: this.config.blogUrl,
        sessionDurationDays: this.config.sessionDurationDays,
      })
    );

    this.app.route("/", devEmailRoutes({ blogUrl: this.config.blogUrl }));
  }
}

export class TestApp extends BaseApp {
  constructor(
    db: Database.Database,
    config: Configuration,
    providers: Map<ProviderName, ProviderInstance> = new Map(),
    emailClient?: EmailClient,
    readonly authMiddleware?: MiddlewareHandler
  ) {
    super(db, config, providers, emailClient);
    this.beforeMountRoutes();
    this.mountRoutes();
  }

  protected beforeMountRoutes(): void {
    if (this.authMiddleware) {
      this.app.use("*", this.authMiddleware);
    }
  }
}

export function createApp(config: Configuration): BaseApp {
  mkdirSync(dirname(config.databasePath), { recursive: true });
  const db = initDb(config.databasePath);
  const providers = createProviders(config);
  const isProd = config.nodeEnv === "production";
  const emailClient = config.resendApiKey
    ? new ResendEmailClient(config.resendApiKey, config.fromEmail)
    : isProd
      ? undefined
      : new ConsoleEmailClient();

  return isProd
    ? new ProdApp(db, config, providers, emailClient)
    : new DevApp(db, config, providers, emailClient);
}
