import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import type Database from "better-sqlite3";
import { createTestApp } from "../../../comments/src/app.js";
import { initDb, upsertUser, type User } from "../../../comments/src/db/index.js";
import { loadConfig } from "../../../comments/src/config.js";
import type { AppEnv } from "../../../comments/src/types.js";
import {
  fetchCurrentUser,
  fetchProviders,
  fetchComments,
  postComment,
  deleteComment,
  logout,
} from "../../src/lib/comments/api.js";

const API_BASE = "http://test";
const testConfig = loadConfig({});

function createTestFetch(app: Hono<AppEnv>) {
  const cookies: Record<string, string> = {};

  const fetchFn = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = new URL(typeof input === "string" ? input : input instanceof Request ? input.url : input.href);
    const headers = new Headers(init?.headers);

    const cookieStr = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
    if (cookieStr) headers.set("Cookie", cookieStr);

    const req = new Request("http://localhost" + url.pathname + url.search, { ...init, headers });
    const res = await app.fetch(req);

    res.headers.forEach((v, k) => {
      if (k === "set-cookie") {
        const match = v.match(/^([^=]+)=([^;]*)/);
        if (match) cookies[match[1]] = match[2];
      }
    });

    return res;
  };

  fetchFn.cookies = cookies;
  return fetchFn;
}

function mockAuth(user: User): MiddlewareHandler {
  return async (c, next) => {
    c.set("user", {
      id: user.id,
      name: user.name,
      avatar_url: user.avatar_url,
      is_admin: !!user.is_admin,
    });
    await next();
  };
}

let db: Database.Database;
let testUser: User;
let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  db = initDb(":memory:");
  testUser = upsertUser(db, "github", "1", "Alice", "alice@test.com", "https://avatar.test/alice.png");

  const app = createTestApp(db, testConfig, { authMiddleware: mockAuth(testUser) });
  globalThis.fetch = createTestFetch(app) as typeof globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("fetchCurrentUser", () => {
  it("returns the authenticated user", async () => {
    const user = await fetchCurrentUser(API_BASE);
    expect(user).toEqual({
      id: testUser.id,
      name: "Alice",
      avatar_url: "https://avatar.test/alice.png",
      is_admin: false,
    });
  });

  it("returns null when not authenticated", async () => {
    const app = createTestApp(db, testConfig);
    globalThis.fetch = createTestFetch(app) as typeof globalThis.fetch;

    const user = await fetchCurrentUser(API_BASE);
    expect(user).toBeNull();
  });
});

describe("fetchProviders", () => {
  it("returns empty list when no providers configured", async () => {
    const providers = await fetchProviders(API_BASE);
    expect(providers).toEqual([]);
  });
});

describe("fetchComments", () => {
  it("returns empty array for slug with no comments", async () => {
    const comments = await fetchComments(API_BASE, "test-post");
    expect(comments).toEqual([]);
  });

  it("returns comments after posting", async () => {
    await postComment(API_BASE, "test-post", "Hello world!");
    const comments = await fetchComments(API_BASE, "test-post");
    expect(comments).toHaveLength(1);
    expect(comments[0].body).toBe("Hello world!");
    expect(comments[0].author_name).toBe("Alice");
  });
});

describe("postComment", () => {
  it("creates a comment retrievable via fetchComments", async () => {
    await postComment(API_BASE, "my-post", "First comment");
    await postComment(API_BASE, "my-post", "Second comment");

    const comments = await fetchComments(API_BASE, "my-post");
    expect(comments).toHaveLength(2);
    expect(comments[0].body).toBe("First comment");
    expect(comments[1].body).toBe("Second comment");
  });

  it("creates a reply with parent_id", async () => {
    await postComment(API_BASE, "my-post", "Parent");
    const comments = await fetchComments(API_BASE, "my-post");
    const parentId = comments[0].id;

    await postComment(API_BASE, "my-post", "Reply", parentId);

    const updated = await fetchComments(API_BASE, "my-post");
    expect(updated).toHaveLength(1);
    expect(updated[0].replies).toHaveLength(1);
    expect(updated[0].replies![0].body).toBe("Reply");
  });

  it("throws on validation error", async () => {
    await expect(postComment(API_BASE, "my-post", "")).rejects.toThrow();
  });

  it("throws when not authenticated", async () => {
    const app = createTestApp(db, testConfig);
    globalThis.fetch = createTestFetch(app) as typeof globalThis.fetch;

    await expect(postComment(API_BASE, "my-post", "Hello")).rejects.toThrow();
  });
});

describe("deleteComment", () => {
  it("removes comment from listing", async () => {
    await postComment(API_BASE, "my-post", "To delete");
    const comments = await fetchComments(API_BASE, "my-post");
    expect(comments).toHaveLength(1);

    await deleteComment(API_BASE, comments[0].id);

    const after = await fetchComments(API_BASE, "my-post");
    expect(after).toHaveLength(0);
  });

  it("throws when deleting non-existent comment", async () => {
    await expect(deleteComment(API_BASE, 99999)).rejects.toThrow();
  });
});

describe("logout", () => {
  it("clears session so fetchCurrentUser returns null", async () => {
    // Use real session middleware so logout actually clears the session
    const { createSession } = await import("../../../comments/src/db/sessions.js");
    const session = createSession(db, testUser.id, 30);

    const app = createTestApp(db, testConfig);
    const testFetch = createTestFetch(app);
    testFetch.cookies["session_id"] = session.id;
    globalThis.fetch = testFetch as typeof globalThis.fetch;

    const before = await fetchCurrentUser(API_BASE);
    expect(before).not.toBeNull();

    await logout(API_BASE);

    const after = await fetchCurrentUser(API_BASE);
    expect(after).toBeNull();
  });
});
