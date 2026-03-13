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

export function parseDate(value: string): Date {
  return new Date(value + "Z");
}

export function initDb(path: string = ":memory:"): Database.Database {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}
