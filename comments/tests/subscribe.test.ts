import { describe, it, expect, beforeEach } from "vitest";
import { initDb, upsertUser, type User } from "../src/db/index.js";
import { TestApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import type { EmailClient } from "../src/email/emailClient.js";
import { type Result, ok } from "../src/result.js";
import type Database from "better-sqlite3";
import type { MiddlewareHandler } from "hono";
import { mkdtempSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

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
      return ok({ id: "mock-" + sent.length });
    },
  };
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
let regularUser: User;
let emailClient: ReturnType<typeof createMockEmailClient>;
let contentDir: string;

const testConfig = loadConfig({});

function makeApp(user?: User) {
  return new TestApp(
    db,
    { ...testConfig, contentDir },
    undefined,
    emailClient,
    user ? mockAuth(user) : undefined
  ).app;
}

beforeEach(() => {
  db = initDb(":memory:");
  adminUser = upsertUser(db, "github", "1", "Admin", "admin@test.com", null);
  db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").run(adminUser.id);
  adminUser = { ...adminUser, is_admin: 1 };

  regularUser = upsertUser(db, "github", "2", "User", "user@test.com", null);
  emailClient = createMockEmailClient();

  contentDir = mkdtempSync(join(tmpdir(), "blog-test-"));
  writeFileSync(
    join(contentDir, "test-post.md"),
    `---\ntitle: Test Post Title\ndate: 2026-01-01\n---\n\nThis is the beginning of a test blog post with some content that will be used as an excerpt.`
  );
});

describe("POST /subscribe", () => {
  it("sends confirmation email for valid email", async () => {
    const app = makeApp();
    const res = await app.request("/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "subscriber@example.com" }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.message).toContain("Check your email");
    expect(emailClient.sent).toHaveLength(1);
    expect(emailClient.sent[0].to).toBe("subscriber@example.com");
    expect(emailClient.sent[0].subject).toBe("Confirm your subscription");
  });

  it("returns 400 for invalid email", async () => {
    const app = makeApp();
    const res = await app.request("/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 200 for already confirmed subscriber", async () => {
    const app = makeApp();

    // Subscribe
    await app.request("/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "subscriber@example.com" }),
    });

    // Confirm directly in DB
    db.prepare("UPDATE subscribers SET confirmed = 1 WHERE email = ?").run(
      "subscriber@example.com"
    );

    // Subscribe again
    const res = await app.request("/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "subscriber@example.com" }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.alreadySubscribed).toBe(true);
    expect(data.message).toContain("already on the list");
  });
});

describe("GET /subscribe/confirm", () => {
  it("confirms subscription and redirects", async () => {
    const app = makeApp();

    await app.request("/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "subscriber@example.com" }),
    });

    const token = db
      .prepare("SELECT confirm_token FROM subscribers WHERE email = ?")
      .get("subscriber@example.com") as { confirm_token: string };

    const res = await app.request(`/subscribe/confirm?token=${token.confirm_token}`);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("subscribed=true");
  });

  it("returns 404 for invalid token", async () => {
    const app = makeApp();
    const res = await app.request("/subscribe/confirm?token=bad-token");
    expect(res.status).toBe(404);
  });

  it("redirects for already confirmed (idempotent)", async () => {
    const app = makeApp();

    await app.request("/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "subscriber@example.com" }),
    });

    const token = db
      .prepare("SELECT confirm_token FROM subscribers WHERE email = ?")
      .get("subscriber@example.com") as { confirm_token: string };

    // Confirm twice
    await app.request(`/subscribe/confirm?token=${token.confirm_token}`);
    const res = await app.request(`/subscribe/confirm?token=${token.confirm_token}`);
    expect(res.status).toBe(302);
  });
});

describe("GET /subscribe/unsubscribe", () => {
  it("removes subscriber", async () => {
    const app = makeApp();

    await app.request("/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "subscriber@example.com" }),
    });

    const row = db
      .prepare("SELECT unsubscribe_token FROM subscribers WHERE email = ?")
      .get("subscriber@example.com") as { unsubscribe_token: string };

    const res = await app.request(
      `/subscribe/unsubscribe?token=${row.unsubscribe_token}`
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toContain("unsubscribed");

    const count = db
      .prepare("SELECT COUNT(*) as c FROM subscribers WHERE email = ?")
      .get("subscriber@example.com") as { c: number };
    expect(count.c).toBe(0);
  });

  it("returns 404 for invalid token", async () => {
    const app = makeApp();
    const res = await app.request("/subscribe/unsubscribe?token=bad-token");
    expect(res.status).toBe(404);
  });
});

describe("GET /subscribe/status", () => {
  it("returns 403 for non-admin", async () => {
    const app = makeApp(regularUser);
    const res = await app.request("/subscribe/status?slug=test-post");
    expect(res.status).toBe(403);
  });

  it("returns empty history for admin", async () => {
    const app = makeApp(adminUser);
    const res = await app.request("/subscribe/status?slug=test-post");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.history).toEqual([]);
  });
});

describe("POST /subscribe/notify", () => {
  it("returns 403 for non-admin", async () => {
    const app = makeApp(regularUser);
    const res = await app.request("/subscribe/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "test-post" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 403 for unauthenticated user", async () => {
    const app = makeApp();
    const res = await app.request("/subscribe/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "test-post" }),
    });
    expect(res.status).toBe(403);
  });

  it("sends notification to confirmed subscribers", async () => {
    const app = makeApp(adminUser);

    // Create and confirm subscriber
    await app.request("/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "subscriber@example.com" }),
    });
    db.prepare("UPDATE subscribers SET confirmed = 1 WHERE email = ?").run(
      "subscriber@example.com"
    );

    emailClient.sent.length = 0; // clear confirmation email

    const res = await app.request("/subscribe/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "test-post" }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sent).toBe(1);
    expect(emailClient.sent).toHaveLength(1);
    expect(emailClient.sent[0].subject).toContain("Test Post Title");
  });

  it("does not re-send to already notified subscribers", async () => {
    const app = makeApp(adminUser);

    await app.request("/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "subscriber@example.com" }),
    });
    db.prepare("UPDATE subscribers SET confirmed = 1 WHERE email = ?").run(
      "subscriber@example.com"
    );

    emailClient.sent.length = 0;

    // Send first time
    await app.request("/subscribe/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "test-post" }),
    });
    expect(emailClient.sent).toHaveLength(1);

    // Send second time
    const res = await app.request("/subscribe/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "test-post" }),
    });
    const data = await res.json();
    expect(data.sent).toBe(0);
    expect(emailClient.sent).toHaveLength(1); // no new emails
  });

  it("returns 404 for non-existent post", async () => {
    const app = makeApp(adminUser);
    const res = await app.request("/subscribe/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "non-existent-post" }),
    });
    expect(res.status).toBe(404);
  });
});
