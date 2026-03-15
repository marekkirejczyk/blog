import { describe, it, expect, beforeEach, vi } from "vitest";
import type Database from "better-sqlite3";
import { initDb } from "../../src/db/init.js";
import { createTestApp } from "../../src/app.js";
import { loadConfig } from "../../src/config.js";
import type { ProviderName, ProviderInstance } from "../../src/auth/providers.js";

// Mock userinfo fetching
vi.mock("../../src/auth/userinfo.js", () => ({
  fetchUserInfo: vi.fn().mockResolvedValue({
    providerId: "gh-42",
    name: "Test User",
    email: "test@example.com",
    avatarUrl: "https://avatar.url",
  }),
}));

function createMockProvider(usesPKCE: boolean): ProviderInstance {
  const authUrl = new URL("https://example.com/authorize?state=mock");
  return {
    provider: {
      createAuthorizationURL: vi.fn().mockReturnValue(authUrl),
      validateAuthorizationCode: vi.fn().mockResolvedValue({
        accessToken: () => "mock-access-token",
      }),
    },
    scopes: ["user"],
    usesPKCE,
  };
}

let db: Database.Database;
let providers: Map<ProviderName, ProviderInstance>;

beforeEach(() => {
  db = initDb(":memory:");
  providers = new Map([["github", createMockProvider(false)]]);
  vi.clearAllMocks();
});

const testConfig = loadConfig({});

function app() {
  return createTestApp(db, testConfig, { providers });
}

describe("GET /auth/providers", () => {
  it("returns list of configured providers", async () => {
    const res = await app().request("/auth/providers");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.providers).toEqual(["github"]);
  });
});

describe("GET /auth/:provider", () => {
  it("redirects to OAuth provider", async () => {
    const res = await app().request("/auth/github", { redirect: "manual" });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("example.com/authorize");
    // State cookie should be set
    const cookies = res.headers.get("Set-Cookie");
    expect(cookies).toContain("oauth_state=");
  });

  it("returns 400 for unknown provider", async () => {
    const res = await app().request("/auth/unknown");
    expect(res.status).toBe(400);
  });

  it("returns 400 for unconfigured provider", async () => {
    const res = await app().request("/auth/google");
    expect(res.status).toBe(400);
  });
});

describe("GET /auth/:provider/callback", () => {
  it("creates user and session on valid callback", async () => {
    // First, start the OAuth flow to get a state cookie
    const loginRes = await app().request("/auth/github", { redirect: "manual" });
    const stateCookie = loginRes.headers.get("Set-Cookie")!;
    const stateMatch = stateCookie.match(/oauth_state=([^;]+)/);
    const state = stateMatch![1];

    // Simulate callback with matching state
    const callbackRes = await app().request(
      `/auth/github/callback?code=test-code&state=${state}`,
      {
        redirect: "manual",
        headers: { Cookie: `oauth_state=${state}` },
      }
    );

    expect(callbackRes.status).toBe(302);
    expect(callbackRes.headers.get("Location")).toBe(testConfig.blogUrl);
    // Session cookie should be set
    const sessionCookies = callbackRes.headers.get("Set-Cookie");
    expect(sessionCookies).toContain("session_id=");
  });

  it("returns 400 when state does not match", async () => {
    const res = await app().request(
      "/auth/github/callback?code=test-code&state=wrong",
      { headers: { Cookie: "oauth_state=correct" } }
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when no code is provided", async () => {
    const res = await app().request(
      "/auth/github/callback?state=s",
      { headers: { Cookie: "oauth_state=s" } }
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /auth/me", () => {
  it("returns user after login flow", async () => {
    // Complete login flow
    const loginRes = await app().request("/auth/github", { redirect: "manual" });
    const stateCookie = loginRes.headers.get("Set-Cookie")!;
    const state = stateCookie.match(/oauth_state=([^;]+)/)![1];

    const callbackRes = await app().request(
      `/auth/github/callback?code=test-code&state=${state}`,
      {
        redirect: "manual",
        headers: { Cookie: `oauth_state=${state}` },
      }
    );

    const sessionCookie = callbackRes.headers.get("Set-Cookie")!;
    const sessionId = sessionCookie.match(/session_id=([^;]+)/)![1];

    // Check /auth/me with session cookie
    const meRes = await app().request("/auth/me", {
      headers: { Cookie: `session_id=${sessionId}` },
    });
    const body = await meRes.json();
    expect(body.user).toEqual(expect.objectContaining({
      name: "Test User",
      avatar_url: "https://avatar.url",
    }));
  });

  it("returns null user when not logged in", async () => {
    const res = await app().request("/auth/me");
    const body = await res.json();
    expect(body.user).toBeNull();
  });
});

describe("POST /auth/logout", () => {
  it("clears session and returns ok", async () => {
    // Login first
    const loginRes = await app().request("/auth/github", { redirect: "manual" });
    const state = loginRes.headers.get("Set-Cookie")!.match(/oauth_state=([^;]+)/)![1];
    const callbackRes = await app().request(
      `/auth/github/callback?code=test-code&state=${state}`,
      {
        redirect: "manual",
        headers: { Cookie: `oauth_state=${state}` },
      }
    );
    const sessionId = callbackRes.headers.get("Set-Cookie")!.match(/session_id=([^;]+)/)![1];

    // Logout
    const logoutRes = await app().request("/auth/logout", {
      method: "POST",
      headers: { Cookie: `session_id=${sessionId}` },
    });
    expect(logoutRes.status).toBe(200);
    const body = await logoutRes.json();
    expect(body.ok).toBe(true);

    // Verify session is cleared
    const meRes = await app().request("/auth/me", {
      headers: { Cookie: `session_id=${sessionId}` },
    });
    const meBody = await meRes.json();
    expect(meBody.user).toBeNull();
  });
});
