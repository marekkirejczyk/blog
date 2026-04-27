import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import type Database from "better-sqlite3";
import { TestApp } from "../../../comments/src/app.js";
import { initDb, upsertUser, type User } from "../../../comments/src/db/index.js";
import { insertSubscriber, confirmSubscriber } from "../../../comments/src/db/subscribers.js";
import { loadConfig } from "../../../comments/src/config.js";
import type { AppEnv } from "../../../comments/src/types.js";
import type { EmailClient } from "../../../comments/src/email/emailClient.js";
import { ok } from "../../../comments/src/result.js";
import {
  subscribe,
  fetchNotificationStatus,
  sendNotification,
  unsubscribeByToken,
} from "../../src/lib/subscribe/api.js";
import { mkdtempSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const API_BASE = "http://test";

interface SentEmail {
  to: string;
  subject: string;
  html: string;
}

function createMockEmailClient(): EmailClient & { sent: SentEmail[] } {
  const sent: SentEmail[] = [];
  return {
    sent,
    async sendEmail(to, subject, html) {
      sent.push({ to, subject, html });
      return ok({ id: `test-${sent.length}` });
    },
  };
}

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
let adminUser: User;
let emailClient: EmailClient & { sent: SentEmail[] };
let contentDir: string;
let testConfig: ReturnType<typeof loadConfig>;
let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  db = initDb(":memory:");
  adminUser = upsertUser(db, "github", "1", "Admin", "admin@test.com");
  db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").run(adminUser.id);
  adminUser = { ...adminUser, is_admin: 1 } as User;

  emailClient = createMockEmailClient();

  contentDir = mkdtempSync(join(tmpdir(), "subscribe-api-test-"));
  writeFileSync(
    join(contentDir, "test-post.md"),
    "---\ntitle: Test Post\n---\n\nThis is the test post content for integration testing."
  );

  testConfig = loadConfig({ CONTENT_DIR: contentDir });
  const app = new TestApp(
    db,
    testConfig,
    undefined,
    emailClient,
    mockAuth(adminUser)
  ).app;
  globalThis.fetch = createTestFetch(app) as typeof globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("subscribe", () => {
  it("creates a subscriber and returns confirmation message", async () => {
    const result = await subscribe(API_BASE, "test@example.com");
    expect(emailClient.sent).toEqual([{
      to: "test@example.com",
      subject: "Confirm your subscription",
      html: expect.stringContaining("/subscribe/confirm?token="),
    }]);
    expect(result).toEqual({
      message: "Check your email to confirm your subscription.",
    });
  });

  it("returns already-subscribed for confirmed email", async () => {
    const sub = insertSubscriber(db, "confirmed@example.com");
    confirmSubscriber(db, sub.confirm_token);

    const result = await subscribe(API_BASE, "confirmed@example.com");
    expect(emailClient.sent).toEqual([]);
    expect(result).toEqual({
      alreadySubscribed: true,
      message: "You're already on the list.",
    });
  });

  it("throws on invalid email", async () => {
    await expect(subscribe(API_BASE, "not-an-email"))
      .rejects.toThrow("Invalid email address");
  });
});

describe("unsubscribeByToken", () => {
  it("removes a subscriber", async () => {
    const sub = insertSubscriber(db, "unsub@example.com");
    const result = await unsubscribeByToken(API_BASE, sub.unsubscribe_token);
    expect(result).toEqual({ message: "You have been unsubscribed." });
  });

  it("throws on invalid token", async () => {
    await expect(unsubscribeByToken(API_BASE, "bad-token"))
      .rejects.toThrow("Invalid token");
  });
});

describe("fetchNotificationStatus", () => {
  it("returns empty history for slug with no notifications", async () => {
    const result = await fetchNotificationStatus(API_BASE, "test-post");
    expect(result).toEqual({ history: [] });
  });

  it("returns history grouped by batch, newest first", async () => {
    const slug = "test-post";
    const sub1 = insertSubscriber(db, "one@example.com");
    const sub2 = insertSubscriber(db, "two@example.com");
    const sub3 = insertSubscriber(db, "three@example.com");

    const insert = db.prepare(
      "INSERT INTO notifications_sent (slug, subscriber_id, sent_at) VALUES (?, ?, ?)"
    );
    insert.run(slug, sub1.id, "2024-01-01 10:00:00");
    insert.run(slug, sub2.id, "2024-01-01 10:00:00"); // earlier batch: count 2
    insert.run(slug, sub3.id, "2024-02-01 10:00:00"); // later batch: count 1

    const result = await fetchNotificationStatus(API_BASE, slug);
    expect(result).toEqual({
      history: [
        { sent_at: "2024-02-01T10:00:00.000Z", count: 1 },
        { sent_at: "2024-01-01T10:00:00.000Z", count: 2 },
      ],
    });
  });

  it("throws when not admin", async () => {
    const app = new TestApp(db, testConfig, undefined, emailClient).app;
    globalThis.fetch = createTestFetch(app) as typeof globalThis.fetch;

    await expect(fetchNotificationStatus(API_BASE, "test-post"))
      .rejects.toThrow("Failed to fetch status");
  });
});

describe("sendNotification", () => {
  it("sends to confirmed subscribers and returns count", async () => {
    const sub = insertSubscriber(db, "reader@example.com");
    confirmSubscriber(db, sub.confirm_token);

    const result = await sendNotification(API_BASE, "test-post");
    expect(emailClient.sent).toEqual([{
      to: "reader@example.com",
      subject: expect.stringContaining("Test Post"),
      html: expect.any(String),
    }]);
    expect(result).toEqual({ sent: 1 });
  });

  it("returns zero when no subscribers to notify", async () => {
    const result = await sendNotification(API_BASE, "test-post");
    expect(result).toEqual({ sent: 0, message: "No subscribers to notify." });
  });

  it("does not re-notify already notified subscribers", async () => {
    const sub = insertSubscriber(db, "reader@example.com");
    confirmSubscriber(db, sub.confirm_token);

    await sendNotification(API_BASE, "test-post");
    emailClient.sent.length = 0;

    const result = await sendNotification(API_BASE, "test-post");
    expect(emailClient.sent).toEqual([]);
    expect(result).toEqual({ sent: 0, message: "No subscribers to notify." });
  });

  it("returns history after sending", async () => {
    const sub = insertSubscriber(db, "reader@example.com");
    confirmSubscriber(db, sub.confirm_token);

    await sendNotification(API_BASE, "test-post");

    const status = await fetchNotificationStatus(API_BASE, "test-post");
    expect(status).toEqual({
      history: [{ sent_at: expect.any(String), count: 1 }],
    });
  });

  it("throws when not admin", async () => {
    const app = new TestApp(db, testConfig, undefined, emailClient).app;
    globalThis.fetch = createTestFetch(app) as typeof globalThis.fetch;

    await expect(sendNotification(API_BASE, "test-post"))
      .rejects.toThrow("Forbidden");
  });
});
