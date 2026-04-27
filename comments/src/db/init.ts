import Database from "better-sqlite3";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  provider    TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  name        TEXT NOT NULL,
  email       TEXT,
  avatar_url  TEXT,
  profile_url TEXT,
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

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS subscribers (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  email             TEXT NOT NULL UNIQUE,
  confirmed         INTEGER DEFAULT 0,
  confirm_token     TEXT NOT NULL,
  unsubscribe_token TEXT NOT NULL,
  created_at        TEXT DEFAULT (datetime('now')),
  confirmed_at      TEXT
);

CREATE INDEX IF NOT EXISTS idx_subscribers_confirm ON subscribers(confirm_token);
CREATE INDEX IF NOT EXISTS idx_subscribers_unsub ON subscribers(unsubscribe_token);

CREATE TABLE IF NOT EXISTS notifications_sent (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL,
  subscriber_id INTEGER NOT NULL REFERENCES subscribers(id),
  sent_at       TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_slug ON notifications_sent(slug, subscriber_id);
`;

export function initDb(path: string = ":memory:"): Database.Database {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}
