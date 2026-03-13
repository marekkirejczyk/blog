import { describe, it, expect, beforeEach } from "vitest";
import { initDb, upsertUser, type User } from "../src/db.js";
import { createApp } from "../src/app.js";
import type Database from "better-sqlite3";
import type { MiddlewareHandler } from "hono";

let db: Database.Database;
let testUser: User;
let otherUser: User;

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

function authedApp(user?: User) {
  return createApp(db, {
    corsOrigin: "*",
    authMiddleware: user ? mockAuth(user) : undefined,
  });
}

beforeEach(() => {
  db = initDb(":memory:");
  testUser = upsertUser(db, "github", "1", "Alice", "alice@test.com", null);
  otherUser = upsertUser(db, "github", "2", "Bob", "bob@test.com", null);
});

describe("GET /comments", () => {
  it("returns empty list for slug with no comments", async () => {
    const app = authedApp(testUser);
    const res = await app.request("/comments?slug=test-post");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.comments).toEqual([]);
  });

  it("returns 400 when slug is missing", async () => {
    const app = authedApp(testUser);
    const res = await app.request("/comments");
    expect(res.status).toBe(400);
  });

  it("returns 400 when slug is invalid", async () => {
    const app = authedApp(testUser);
    const res = await app.request("/comments?slug=INVALID SLUG!");
    expect(res.status).toBe(400);
  });
});

describe("POST /comments", () => {
  it("creates a comment when logged in", async () => {
    const app = authedApp(testUser);
    const res = await app.request("/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "test-post", body: "Hello world!" }),
    });
    expect(res.status).toBe(201);
    const comment = await res.json();
    expect(comment.body).toBe("Hello world!");
    expect(comment.author_name).toBe("Alice");
    expect(comment.slug).toBe("test-post");
    expect(comment.id).toBeDefined();
  });

  it("returns 401 when not logged in", async () => {
    const app = authedApp(); // no user
    const res = await app.request("/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "test-post", body: "Hello world!" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 for empty body", async () => {
    const app = authedApp(testUser);
    const res = await app.request("/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "test-post", body: "" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for body exceeding 2000 chars", async () => {
    const app = authedApp(testUser);
    const res = await app.request("/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "test-post", body: "x".repeat(2001) }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid slug", async () => {
    const app = authedApp(testUser);
    const res = await app.request("/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "BAD SLUG!", body: "Hello" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /comments with parent_id", () => {
  it("creates a reply when logged in", async () => {
    const app = authedApp(testUser);

    // Create parent comment
    const parentRes = await app.request("/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "test-post", body: "Parent comment" }),
    });
    const parent = await parentRes.json();

    // Create reply
    const replyRes = await app.request("/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "test-post",
        body: "Reply to parent",
        parent_id: parent.id,
      }),
    });
    expect(replyRes.status).toBe(201);
    const reply = await replyRes.json();
    expect(reply.parent_id).toBe(parent.id);

    // Verify nesting in GET response
    const getRes = await app.request("/comments?slug=test-post");
    const data = await getRes.json();
    expect(data.comments).toHaveLength(1);
    expect(data.comments[0].replies).toHaveLength(1);
    expect(data.comments[0].replies[0].body).toBe("Reply to parent");
  });

  it("returns 401 when not logged in", async () => {
    // First create a parent with an authed app
    const authed = authedApp(testUser);
    const parentRes = await authed.request("/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "test-post", body: "Parent comment" }),
    });
    const parent = await parentRes.json();

    // Try to reply without auth
    const unauthed = authedApp(); // no user
    const res = await unauthed.request("/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "test-post",
        body: "Reply",
        parent_id: parent.id,
      }),
    });
    expect(res.status).toBe(401);
  });
});

describe("GET /comments with data", () => {
  it("returns created comments", async () => {
    const app = authedApp(testUser);

    await app.request("/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "test-post", body: "First comment" }),
    });
    await app.request("/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "test-post", body: "Second comment" }),
    });

    const res = await app.request("/comments?slug=test-post");
    const data = await res.json();
    expect(data.comments).toHaveLength(2);
    expect(data.comments[0].body).toBe("First comment");
    expect(data.comments[1].body).toBe("Second comment");
  });
});

describe("DELETE /comments/:id", () => {
  it("soft deletes own comment", async () => {
    const app = authedApp(testUser);

    const createRes = await app.request("/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "test-post", body: "To be deleted" }),
    });
    const comment = await createRes.json();

    const delRes = await app.request(`/comments/${comment.id}`, {
      method: "DELETE",
    });
    expect(delRes.status).toBe(204);

    // Verify it no longer appears in GET
    const getRes = await app.request("/comments?slug=test-post");
    const data = await getRes.json();
    expect(data.comments).toHaveLength(0);
  });

  it("returns 403 when deleting another user's comment", async () => {
    // Alice creates a comment
    const aliceApp = authedApp(testUser);
    const createRes = await aliceApp.request("/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "test-post", body: "Alice's comment" }),
    });
    const comment = await createRes.json();

    // Bob tries to delete it
    const bobApp = authedApp(otherUser);
    const delRes = await bobApp.request(`/comments/${comment.id}`, {
      method: "DELETE",
    });
    expect(delRes.status).toBe(403);
  });

  it("returns 404 for non-existent comment", async () => {
    const app = authedApp(testUser);
    const res = await app.request("/comments/99999", { method: "DELETE" });
    expect(res.status).toBe(404);
  });
});
