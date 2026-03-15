import { describe, it, expect, beforeEach } from "vitest";
import type Database from "better-sqlite3";
import { initDb } from "../../src/db/init.js";
import { upsertUser } from "../../src/db/users.js";
import { createSession } from "../../src/db/sessions.js";
import { createTestApp } from "../../src/app.js";
import { loadConfig } from "../../src/config.js";

const testConfig = loadConfig({});

let db: Database.Database;
let sessionId: string;
let userName: string;

beforeEach(() => {
  db = initDb(":memory:");
  const user = upsertUser(db, "github", "1", "Alice", "alice@test.com", "https://alice.png");
  userName = user.name;
  const session = createSession(db, user.id);
  sessionId = session.id;
});

function app() {
  // No authMiddleware = uses session middleware by default
  // Pass empty providers map so auth routes (including /auth/me) are mounted
  return createTestApp(db, testConfig);
}

describe("session middleware", () => {
  it("sets user context for valid session cookie", async () => {
    const res = await app().request("/auth/me", {
      headers: { Cookie: `session_id=${sessionId}` },
    });
    const body = await res.json();
    expect(body.user).toEqual(expect.objectContaining({
      name: userName,
      avatar_url: "https://alice.png",
    }));
  });

  it("returns null user when no session cookie", async () => {
    const res = await app().request("/auth/me");
    const body = await res.json();
    expect(body.user).toBeNull();
  });

  it("returns null user for invalid session cookie", async () => {
    const res = await app().request("/auth/me", {
      headers: { Cookie: "session_id=nonexistent" },
    });
    const body = await res.json();
    expect(body.user).toBeNull();
  });

  it("returns null user for expired session", async () => {
    db.prepare(`UPDATE sessions SET expires_at = datetime('now', '-1 hour') WHERE id = ?`)
      .run(sessionId);
    const res = await app().request("/auth/me", {
      headers: { Cookie: `session_id=${sessionId}` },
    });
    const body = await res.json();
    expect(body.user).toBeNull();
  });
});
