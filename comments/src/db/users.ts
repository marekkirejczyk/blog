import type Database from "better-sqlite3";
import { parseDate } from "../utils/dates.js";

export interface User {
  id: number;
  provider: string;
  provider_id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  is_admin: number;
  created_at: Date;
}

interface RawUser extends Omit<User, "created_at"> {
  created_at: string;
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

  const row = db
    .prepare(
      `SELECT * FROM users WHERE provider = ? AND provider_id = ?`
    )
    .get(provider, providerId) as RawUser;

  return { ...row, created_at: parseDate(row.created_at) };
}

export function getUserById(
  db: Database.Database,
  id: number
): User | undefined {
  const row = db
    .prepare(`SELECT * FROM users WHERE id = ?`)
    .get(id) as RawUser | undefined;

  return row ? { ...row, created_at: parseDate(row.created_at) } : undefined;
}
