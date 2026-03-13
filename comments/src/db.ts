import Database from "better-sqlite3";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  provider    TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  name        TEXT NOT NULL,
  email       TEXT,
  avatar_url  TEXT,
  is_admin    INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  UNIQUE(provider, provider_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  parent_id  INTEGER REFERENCES comments(id),
  body       TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_comments_slug ON comments(slug, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
`;

export interface User {
  id: number;
  provider: string;
  provider_id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  is_admin: number;
  created_at: string;
}

export interface Comment {
  id: number;
  slug: string;
  user_id: number;
  parent_id: number | null;
  body: string;
  created_at: string;
  deleted_at: string | null;
  author_name: string;
  author_avatar: string | null;
}

export interface CommentWithReplies extends Comment {
  replies: Comment[];
}

export function initDb(path: string = ":memory:"): Database.Database {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}

export function getCommentsBySlug(
  db: Database.Database,
  slug: string
): CommentWithReplies[] {
  const rows = db
    .prepare(
      `SELECT c.id, c.slug, c.user_id, c.parent_id, c.body, c.created_at,
              u.name as author_name, u.avatar_url as author_avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.slug = ? AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC`
    )
    .all(slug) as Comment[];

  const topLevel: CommentWithReplies[] = [];
  const byId = new Map<number, CommentWithReplies>();

  // First pass: index all comments
  for (const row of rows) {
    const comment: CommentWithReplies = { ...row, replies: [] };
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

  return db
    .prepare(
      `SELECT c.id, c.slug, c.user_id, c.parent_id, c.body, c.created_at,
              u.name as author_name, u.avatar_url as author_avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`
    )
    .get(result.lastInsertRowid) as Comment;
}

export function getCommentById(
  db: Database.Database,
  id: number
): Comment | undefined {
  return db
    .prepare(
      `SELECT c.id, c.slug, c.user_id, c.parent_id, c.body, c.created_at, c.deleted_at,
              u.name as author_name, u.avatar_url as author_avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`
    )
    .get(id) as Comment | undefined;
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

export function upsertUser(
  db: Database.Database,
  provider: string,
  providerId: string,
  name: string,
  email?: string | null,
  avatarUrl?: string | null
): User {
  db.prepare(
    `INSERT INTO users (provider, provider_id, name, email, avatar_url)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(provider, provider_id) DO UPDATE SET
       name = excluded.name,
       email = excluded.email,
       avatar_url = excluded.avatar_url`
  ).run(provider, providerId, name, email ?? null, avatarUrl ?? null);

  return db
    .prepare(
      `SELECT * FROM users WHERE provider = ? AND provider_id = ?`
    )
    .get(provider, providerId) as User;
}
