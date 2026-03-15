import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { generateState, generateCodeVerifier } from "arctic";
import type { AppEnv, RouteContext } from "../types.js";
import type { ProviderName, ProviderInstance } from "../auth/providers.js";
import { PROVIDER_NAMES } from "../auth/providers.js";
import { fetchUserInfo } from "../auth/userinfo.js";
import { upsertUser } from "../db/users.js";
import { createSession, deleteSession } from "../db/sessions.js";
import { SESSION_COOKIE } from "../middleware/session.js";

interface AuthRoutesOptions {
  providers: Map<ProviderName, ProviderInstance>;
  blogUrl: string;
  secureCookies: boolean;
  sessionDurationDays: number;
}

const STATE_COOKIE = "oauth_state";
const VERIFIER_COOKIE = "oauth_verifier";
const COOKIE_MAX_AGE_SECONDS = 600; // 10 minutes for OAuth flow
const DAYS_TO_SECONDS = 24 * 60 * 60;

function getProvider(
  providers: Map<ProviderName, ProviderInstance>,
  name: string
): ProviderInstance | null {
  if (!PROVIDER_NAMES.includes(name as ProviderName)) return null;
  return providers.get(name as ProviderName) ?? null;
}

function handleLogin(
  ctx: RouteContext,
  providers: Map<ProviderName, ProviderInstance>,
  secureCookies: boolean
) {
  const providerName = ctx.req.param("provider");
  const instance = getProvider(providers, providerName);
  if (!instance) {
    return ctx.json({ error: "Unknown or unconfigured provider" }, 400);
  }

  const state = generateState();
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    secure: secureCookies,
    sameSite: "lax" as const,
    maxAge: COOKIE_MAX_AGE_SECONDS,
  };

  setCookie(ctx, STATE_COOKIE, state, cookieOptions);

  let url: URL;
  if (instance.usesPKCE) {
    const codeVerifier = generateCodeVerifier();
    setCookie(ctx, VERIFIER_COOKIE, codeVerifier, cookieOptions);
    // Google and Twitter use PKCE
    const provider = instance.provider as {
      createAuthorizationURL(state: string, codeVerifier: string, scopes: string[]): URL;
    };
    url = provider.createAuthorizationURL(state, codeVerifier, instance.scopes);
  } else {
    const provider = instance.provider as {
      createAuthorizationURL(state: string, scopes: string[]): URL;
    };
    url = provider.createAuthorizationURL(state, instance.scopes);
  }

  return ctx.redirect(url.toString());
}

async function handleCallback(
  ctx: RouteContext,
  providers: Map<ProviderName, ProviderInstance>,
  blogUrl: string,
  secureCookies: boolean,
  sessionDurationDays: number
) {
  const providerName = ctx.req.param("provider") as ProviderName;
  const instance = getProvider(providers, providerName);
  if (!instance) {
    return ctx.json({ error: "Unknown or unconfigured provider" }, 400);
  }

  const code = ctx.req.query("code");
  const state = ctx.req.query("state");
  const storedState = getCookie(ctx, STATE_COOKIE);

  if (!code || !state || state !== storedState) {
    return ctx.json({ error: "Invalid OAuth state" }, 400);
  }

  // Clear OAuth cookies
  deleteCookie(ctx, STATE_COOKIE, { path: "/" });
  deleteCookie(ctx, VERIFIER_COOKIE, { path: "/" });

  let tokens;
  if (instance.usesPKCE) {
    const codeVerifier = getCookie(ctx, VERIFIER_COOKIE);
    if (!codeVerifier) {
      return ctx.json({ error: "Missing code verifier" }, 400);
    }
    const provider = instance.provider as {
      validateAuthorizationCode(code: string, codeVerifier: string): Promise<{ accessToken(): string }>;
    };
    tokens = await provider.validateAuthorizationCode(code, codeVerifier);
  } else {
    const provider = instance.provider as {
      validateAuthorizationCode(code: string): Promise<{ accessToken(): string }>;
    };
    tokens = await provider.validateAuthorizationCode(code);
  }

  const accessToken = tokens.accessToken();
  const userInfo = await fetchUserInfo(providerName, accessToken);

  const db = ctx.get("db");
  const user = upsertUser(
    db,
    providerName,
    userInfo.providerId,
    userInfo.name,
    userInfo.email,
    userInfo.avatarUrl
  );

  const session = createSession(db, user.id, sessionDurationDays);

  setCookie(ctx, SESSION_COOKIE, session.id, {
    path: "/",
    httpOnly: true,
    secure: secureCookies,
    sameSite: secureCookies ? "none" : "lax",
    maxAge: sessionDurationDays * DAYS_TO_SECONDS,
  });

  return ctx.redirect(blogUrl);
}

function handleMe(ctx: RouteContext) {
  const user = ctx.get("user");
  return ctx.json({ user: user ?? null });
}

function handleLogout(ctx: RouteContext) {
  const sessionId = getCookie(ctx, SESSION_COOKIE);
  if (sessionId) {
    const db = ctx.get("db");
    deleteSession(db, sessionId);
  }
  deleteCookie(ctx, SESSION_COOKIE, { path: "/" });
  return ctx.json({ ok: true });
}

function handleProviders(
  ctx: RouteContext,
  providers: Map<ProviderName, ProviderInstance>
) {
  const available = Array.from(providers.keys());
  return ctx.json({ providers: available });
}

export function authRoutes(options: AuthRoutesOptions) {
  const app = new Hono<AppEnv>();
  const { providers, blogUrl, secureCookies, sessionDurationDays } = options;

  app.get("/auth/providers", (ctx) => handleProviders(ctx, providers));
  app.get("/auth/me", handleMe);
  app.post("/auth/logout", handleLogout);
  app.get("/auth/:provider", (ctx) => handleLogin(ctx, providers, secureCookies));
  app.get("/auth/:provider/callback", (ctx) =>
    handleCallback(ctx, providers, blogUrl, secureCookies, sessionDurationDays)
  );

  return app;
}
