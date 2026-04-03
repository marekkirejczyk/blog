import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { html } from "hono/html";
import type { AppEnv, RouteContext } from "../types.js";
import { upsertUser } from "../db/users.js";
import { createSession } from "../db/sessions.js";
import { SESSION_COOKIE } from "../middleware/session.js";

interface DevAuthOptions {
  blogUrl: string;
  sessionDurationDays: number;
}

function handleDevLoginForm(ctx: RouteContext) {
  const redirect = ctx.req.query("redirect") ?? "";
  return ctx.html(html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Dev Login</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            color: #1a1a1a;
            background: #fff;
            max-width: 400px;
            margin: 4rem auto;
            padding: 0 1rem;
          }
          h1 { font-size: 1.3rem; margin-bottom: 0.5rem; }
          p { font-size: 0.9rem; color: #666; margin-bottom: 1.5rem; }
          label { display: block; font-size: 0.85rem; color: #666; margin-bottom: 0.25rem; }
          input {
            width: 100%;
            padding: 0.6rem 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 0.95rem;
            margin-bottom: 1rem;
          }
          input:focus { outline: none; border-color: #999; }
          button {
            background: #1a1a1a;
            color: #fff;
            border: none;
            padding: 0.6rem 1.5rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            width: 100%;
          }
          button:hover { background: #333; }
          .badge {
            display: inline-block;
            background: #fff3cd;
            color: #856404;
            font-size: 0.75rem;
            padding: 0.2rem 0.5rem;
            border-radius: 3px;
            margin-bottom: 1rem;
          }
        </style>
      </head>
      <body>
        <h1>Dev Login</h1>
        <span class="badge">Development only</span>
        <p>Sign in as any user to test the comment system.</p>
        <form method="POST" action="/auth/dev">
          <input type="hidden" name="redirect" value="${redirect}" />
          <label for="name">Name</label>
          <input type="text" id="name" name="name" value="Dev User" required />
          <label for="email">Email</label>
          <input type="email" id="email" name="email" value="dev@localhost" required />
          <button type="submit">Sign in</button>
        </form>
      </body>
    </html>`);
}

async function handleDevLogin(
  ctx: RouteContext,
  blogUrl: string,
  sessionDurationDays: number
) {
  const body = await ctx.req.parseBody();
  const name = String(body.name || "Dev User");
  const email = String(body.email || "dev@localhost");
  const redirect = String(body.redirect || "");

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=64`;

  const db = ctx.get("db");
  const user = upsertUser(db, "dev", email, name, email, avatarUrl);
  const session = createSession(db, user.id, sessionDurationDays);

  const DAYS_TO_SECONDS = 24 * 60 * 60;
  setCookie(ctx, SESSION_COOKIE, session.id, {
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: sessionDurationDays * DAYS_TO_SECONDS,
  });

  return ctx.redirect(redirect || blogUrl);
}

export function devAuthRoutes(options: DevAuthOptions) {
  const app = new Hono<AppEnv>();
  const { blogUrl, sessionDurationDays } = options;

  app.get("/auth/dev", handleDevLoginForm);
  app.post("/auth/dev", (ctx) =>
    handleDevLogin(ctx, blogUrl, sessionDurationDays)
  );

  return app;
}
