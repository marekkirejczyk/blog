import type Database from "better-sqlite3";
import { parseDate } from "../utils/dates.js";

export interface Comment {
  id: number;
  slug: string;
  user_id: number;
  parent_id: number | null;
  body: string;
  created_at: Date;
  deleted_at: Date | null;
  author_name: string;
  author_avatar: string | null;
  author_profile_url: string | null;
}

export interface CommentWithReplies extends Comment {
  replies: Comment[];
}

interface RawComment extends Omit<Comment, "created_at" | "deleted_at"> {
  created_at: string;
  deleted_at: string | null;
}

function parseComment(row: RawComment): Comment {
  return {
    ...row,
    created_at: parseDate(row.created_at),
    deleted_at: row.deleted_at ? parseDate(row.deleted_at) : null,
  };
}

export function getCommentsBySlug(
  db: Database.Database,
  slug: string
): CommentWithReplies[] {
  const rows = db
    .prepare(
      `SELECT c.id, c.slug, c.user_id, c.parent_id, c.body, c.created_at,
              u.name as author_name, u.avatar_url as author_avatar, u.profile_url as author_profile_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.slug = ? AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC`
    )
    .all(slug) as RawComment[];

  const topLevel: CommentWithReplies[] = [];
  const byId = new Map<number, CommentWithReplies>();

  // First pass: index all comments
  for (const row of rows) {
    const comment: CommentWithReplies = { ...parseComment(row), replies: [] };
    byId.set(row.id, comment);
  }

  // Second pass: nest replies under parents
  for (const comment of byId.values()) {
    if (comment.parent_id && byId.has(comment.parent_id)) {
      byId.get(comment.parent_id)!.replies.push(comment);
    } else {
      topLevel.push(comment);
    }
  }

  return topLevel;
}

export function createComment(
  db: Database.Database,
  slug: string,
  userId: number,
  body: string,
  parentId?: number
): Comment {
  const result = db
    .prepare(
      `INSERT INTO comments (slug, user_id, body, parent_id)
       VALUES (?, ?, ?, ?)`
    )
    .run(slug, userId, body, parentId ?? null);

  const row = db
    .prepare(
      `SELECT c.id, c.slug, c.user_id, c.parent_id, c.body, c.created_at,
              u.name as author_name, u.avatar_url as author_avatar, u.profile_url as author_profile_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`
    )
    .get(result.lastInsertRowid) as RawComment;

  return parseComment(row);
}

export function getCommentById(
  db: Database.Database,
  id: number
): Comment | undefined {
  const row = db
    .prepare(
      `SELECT c.id, c.slug, c.user_id, c.parent_id, c.body, c.created_at, c.deleted_at,
              u.name as author_name, u.avatar_url as author_avatar, u.profile_url as author_profile_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`
    )
    .get(id) as RawComment | undefined;

  return row ? parseComment(row) : undefined;
}

export function deleteComment(
  db: Database.Database,
  id: number,
  userId: number,
  isAdmin: boolean
): "deleted" | "not_found" | "forbidden" {
  const comment = getCommentById(db, id);
  if (!comment || comment.deleted_at) return "not_found";
  if (comment.user_id !== userId && !isAdmin) return "forbidden";

  db.prepare(`UPDATE comments SET deleted_at = datetime('now') WHERE id = ?`).run(id);
  return "deleted";
}

export function createImportedComment(
  db: Database.Database,
  slug: string,
  userId: number,
  body: string,
  createdAt: string,
  parentId?: number
): Comment {
  const result = db
    .prepare(
      `INSERT INTO comments (slug, user_id, body, parent_id, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(slug, userId, body, parentId ?? null, createdAt);

  const row = db
    .prepare(
      `SELECT c.id, c.slug, c.user_id, c.parent_id, c.body, c.created_at,
              u.name as author_name, u.avatar_url as author_avatar, u.profile_url as author_profile_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`
    )
    .get(result.lastInsertRowid) as RawComment;

  return parseComment(row);
}

export function findImportedComment(
  db: Database.Database,
  slug: string,
  userId: number,
  createdAt: string,
  body: string
): Comment | undefined {
  const row = db
    .prepare(
      `SELECT c.id, c.slug, c.user_id, c.parent_id, c.body, c.created_at, c.deleted_at,
              u.name as author_name, u.avatar_url as author_avatar, u.profile_url as author_profile_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.slug = ? AND c.user_id = ? AND c.created_at = ? AND c.body = ?`
    )
    .get(slug, userId, createdAt, body) as RawComment | undefined;

  return row ? parseComment(row) : undefined;
}
