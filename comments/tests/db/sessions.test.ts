import { describe, it, expect, beforeEach } from "vitest";
import type Database from "better-sqlite3";
import { initDb } from "../../src/db/init.js";
import { upsertUser } from "../../src/db/users.js";
import {
  createSession,
  getSessionWithUser,
  deleteSession,
  deleteExpiredSessions,
} from "../../src/db/sessions.js";
import { daysFrom } from "../../src/utils/dates.js";

let db: Database.Database;
let userId: number;

beforeEach(() => {
  db = initDb(":memory:");
  const user = upsertUser(db, "github", "1", "Alice", "alice@test.com", "https://alice.png");
  userId = user.id;
});

describe("createSession", () => {
  it("creates a session with UUID and future expiry", () => {
    const session = createSession(db, userId);
    expect(session.id).toBeProperUUID();
    expect(session.user_id).toBe(userId);
    expect(session.created_at).toBeAround(Date.now());
    expect(session.expires_at).toBeAround(daysFrom(30));
  });

  it("respects custom sessionDurationDays", () => {
    const session = createSession(db, userId, 7);
    expect(session.expires_at).toBeAround(daysFrom(7));
  });

  it("creates unique session IDs", () => {
    const s1 = createSession(db, userId);
    const s2 = createSession(db, userId);
    expect(s1.id).not.toBe(s2.id);
  });
});

describe("getSessionWithUser", () => {
  it("returns session and user for valid session", () => {
    const session = createSession(db, userId);
    const result = getSessionWithUser(db, session.id);
    expect(result).not.toBeNull();
    expect(result!.session.id).toBe(session.id);
    expect(result!.user).toEqual(expect.objectContaining({
      id: userId,
      name: "Alice",
      avatar_url: "https://alice.png",
    }));
  });

  it("returns null for non-existent session", () => {
    expect(getSessionWithUser(db, "no-such-session")).toBeNull();
  });

  it("returns null for expired session", () => {
    const session = createSession(db, userId);
    // Manually expire it
    db.prepare(`UPDATE sessions SET expires_at = datetime('now', '-1 hour') WHERE id = ?`)
      .run(session.id);
    expect(getSessionWithUser(db, session.id)).toBeNull();
  });
});

describe("deleteSession", () => {
  it("removes the session", () => {
    const session = createSession(db, userId);
    deleteSession(db, session.id);
    expect(getSessionWithUser(db, session.id)).toBeNull();
  });

  it("does nothing for non-existent session", () => {
    expect(() => deleteSession(db, "no-such-session")).not.toThrow();
  });
});

describe("deleteExpiredSessions", () => {
  it("removes only expired sessions", () => {
    const valid = createSession(db, userId);
    const expired = createSession(db, userId);
    db.prepare(`UPDATE sessions SET expires_at = datetime('now', '-1 hour') WHERE id = ?`)
      .run(expired.id);

    deleteExpiredSessions(db);

    expect(getSessionWithUser(db, valid.id)).not.toBeNull();
    expect(getSessionWithUser(db, expired.id)).toBeNull();
  });
});
