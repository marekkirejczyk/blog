import { describe, it, expect, beforeEach } from "vitest";
import type Database from "better-sqlite3";
import { initDb } from "../../src/db/init.js";
import { upsertUser, type User } from "../../src/db/users.js";
import {
  createComment,
  getCommentsBySlug,
  getCommentById,
  deleteComment,
} from "../../src/db/comments.js";

function objectContaining(obj: Record<string, unknown>) {
  return expect.objectContaining(obj);
}

function expectRecentDate(date: Date, withinMs = 5000) {
  expect(date).toBeInstanceOf(Date);
  expect(Math.abs(date.getTime() - Date.now())).toBeLessThan(withinMs);
}

let db: Database.Database;
let alice: User;
let bob: User;

beforeEach(() => {
  db = initDb(":memory:");
  alice = upsertUser(db, "github", "1", "Alice", "alice@test.com", "https://alice.png");
  bob = upsertUser(db, "github", "2", "Bob", "bob@test.com", null);
});

describe("createComment", () => {
  it("creates a comment and returns it with author info", () => {
    const comment = createComment(db, "test-post", alice.id, "Hello world!");
    expect(comment).toEqual(objectContaining({
      slug: "test-post",
      user_id: alice.id,
      body: "Hello world!",
      parent_id: null,
      author_name: "Alice",
      author_avatar: "https://alice.png",
    }));
    expectRecentDate(comment.created_at);
  });

  it("creates a reply with parent_id", () => {
    const parent = createComment(db, "test-post", alice.id, "Parent");
    const reply = createComment(db, "test-post", bob.id, "Reply", parent.id);
    expect(reply.parent_id).toBe(parent.id);
  });
});

describe("getCommentsBySlug", () => {
  it("returns empty array for unknown slug", () => {
    expect(getCommentsBySlug(db, "no-such-post")).toEqual([]);
  });

  it("returns only comments for the requested slug", () => {
    createComment(db, "post-a", alice.id, "Comment on A");
    createComment(db, "post-b", alice.id, "Comment on B");
    expect(getCommentsBySlug(db, "post-a")).toEqual([
      objectContaining({ body: "Comment on A" }),
    ]);
  });

  it("nests replies under parent", () => {
    const parent = createComment(db, "test-post", alice.id, "Parent");
    createComment(db, "test-post", bob.id, "Reply", parent.id);
    expect(getCommentsBySlug(db, "test-post")).toEqual([
      objectContaining({
        body: "Parent",
        replies: [
          objectContaining({ body: "Reply" }),
        ],
      }),
    ]);
  });

  it("excludes soft-deleted comments", () => {
    const comment = createComment(db, "test-post", alice.id, "To delete");
    deleteComment(db, comment.id, alice.id, false);
    expect(getCommentsBySlug(db, "test-post")).toEqual([]);
  });
});

describe("getCommentById", () => {
  it("returns comment when it exists", () => {
    const created = createComment(db, "test-post", alice.id, "Hello");
    expect(getCommentById(db, created.id)).toEqual(objectContaining({ body: "Hello" }));
  });

  it("returns undefined for non-existent id", () => {
    expect(getCommentById(db, 99999)).toBeUndefined();
  });

  it("includes deleted_at field for deleted comments", () => {
    const comment = createComment(db, "test-post", alice.id, "Will delete");
    deleteComment(db, comment.id, alice.id, false);
    const found = getCommentById(db, comment.id);
    expect(found).toBeDefined();
    expectRecentDate(found!.deleted_at!);
  });
});

describe("deleteComment", () => {
  it("soft deletes own comment and returns 'deleted'", () => {
    const comment = createComment(db, "test-post", alice.id, "My comment");
    expect(deleteComment(db, comment.id, alice.id, false)).toBe("deleted");
  });

  it("returns 'forbidden' when deleting another user's comment", () => {
    const comment = createComment(db, "test-post", alice.id, "Alice's");
    expect(deleteComment(db, comment.id, bob.id, false)).toBe("forbidden");
  });

  it("allows admin to delete any comment", () => {
    const comment = createComment(db, "test-post", alice.id, "Alice's");
    expect(deleteComment(db, comment.id, bob.id, true)).toBe("deleted");
  });

  it("returns 'not_found' for non-existent comment", () => {
    expect(deleteComment(db, 99999, alice.id, false)).toBe("not_found");
  });

  it("returns 'not_found' for already deleted comment", () => {
    const comment = createComment(db, "test-post", alice.id, "To delete");
    deleteComment(db, comment.id, alice.id, false);
    expect(deleteComment(db, comment.id, alice.id, false)).toBe("not_found");
  });
});
