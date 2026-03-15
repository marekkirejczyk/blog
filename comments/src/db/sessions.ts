import type Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { parseDate, formatDate, daysFrom } from "../utils/dates.js";
import type { User } from "./users.js";

export interface Session {
  id: string;
  user_id: number;
  created_at: Date;
  expires_at: Date;
}

interface RawSession {
  id: string;
  user_id: number;
  created_at: string;
  expires_at: string;
}

const DEFAULT_SESSION_DURATION_DAYS = 30;

export function createSession(
  db: Database.Database,
  userId: number,
  sessionDurationDays: number = DEFAULT_SESSION_DURATION_DAYS
): Session {
  const id = randomUUID();
  const expiresAt = daysFrom(sessionDurationDays);
  db.prepare(
    `INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`
  ).run(id, userId, formatDate(expiresAt));

  const row = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as RawSession;
  return {
    ...row,
    created_at: parseDate(row.created_at),
    expires_at: parseDate(row.expires_at),
  };
}

interface RawSessionWithUser extends RawSession {
  user_name: string;
  user_email: string | null;
  user_avatar_url: string | null;
  user_is_admin: number;
}

export interface SessionWithUser {
  session: Session;
  user: Pick<User, "id" | "name" | "avatar_url" | "is_admin">;
}

export function getSessionWithUser(
  db: Database.Database,
  sessionId: string
): SessionWithUser | null {
  const row = db
    .prepare(
      `SELECT s.*, u.name as user_name, u.email as user_email,
              u.avatar_url as user_avatar_url, u.is_admin as user_is_admin
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ? AND s.expires_at > datetime('now')`
    )
    .get(sessionId) as RawSessionWithUser | undefined;

  if (!row) return null;

  return {
    session: {
      id: row.id,
      user_id: row.user_id,
      created_at: parseDate(row.created_at),
      expires_at: parseDate(row.expires_at),
    },
    user: {
      id: row.user_id,
      name: row.user_name,
      avatar_url: row.user_avatar_url,
      is_admin: row.user_is_admin,
    },
  };
}

export function deleteSession(db: Database.Database, sessionId: string): void {
  db.prepare(`DELETE FROM sessions WHERE id = ?`).run(sessionId);
}

export function deleteExpiredSessions(db: Database.Database): void {
  db.prepare(`DELETE FROM sessions WHERE expires_at <= datetime('now')`).run();
}
