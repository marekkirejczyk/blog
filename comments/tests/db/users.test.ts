import { describe, it, expect, beforeEach } from "vitest";
import type Database from "better-sqlite3";
import { initDb } from "../../src/db/init.js";
import { upsertUser, getUserById } from "../../src/db/users.js";

function objectContaining(obj: Record<string, unknown>) {
  return expect.objectContaining(obj);
}

let db: Database.Database;

beforeEach(() => {
  db = initDb(":memory:");
});

describe("upsertUser", () => {
  it("creates a user and returns all fields", () => {
    const user = upsertUser(db, "github", "42", "Alice", "alice@test.com", "https://avatar.url");
    expect(user).toEqual(objectContaining({
      provider: "github",
      provider_id: "42",
      name: "Alice",
      email: "alice@test.com",
      avatar_url: "https://avatar.url",
      is_admin: 0,
    }));
    expect(user.created_at).toBeAround(Date.now());
  });

  it("updates name, email, avatar on conflict", () => {
    upsertUser(db, "github", "42", "Alice", "alice@test.com", null);
    const updated = upsertUser(db, "github", "42", "Alice Updated", "new@test.com", "https://new-avatar.url");
    expect(updated).toEqual(objectContaining({
      name: "Alice Updated",
      email: "new@test.com",
      avatar_url: "https://new-avatar.url",
    }));
  });

  it("creates separate users for different providers with same provider_id", () => {
    const github = upsertUser(db, "github", "42", "Alice GH", null, null);
    const google = upsertUser(db, "google", "42", "Alice Google", null, null);
    expect(github.id).not.toBe(google.id);
  });

  it("defaults email and avatar_url to null", () => {
    const user = upsertUser(db, "github", "1", "Bob");
    expect(user).toEqual(objectContaining({
      email: null,
      avatar_url: null,
    }));
  });
});

describe("getUserById", () => {
  it("returns user by id", () => {
    const created = upsertUser(db, "github", "42", "Alice", "alice@test.com", "https://avatar.url");
    const found = getUserById(db, created.id);
    expect(found).toEqual(objectContaining({
      id: created.id,
      provider: "github",
      provider_id: "42",
      name: "Alice",
      email: "alice@test.com",
      avatar_url: "https://avatar.url",
    }));
    expect(found!.created_at).toBeAround(Date.now());
  });

  it("returns undefined for non-existent id", () => {
    expect(getUserById(db, 99999)).toBeUndefined();
  });
});
