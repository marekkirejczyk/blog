import type Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { parseDate } from "../utils/dates.js";

export interface Subscriber {
  id: number;
  email: string;
  confirmed: boolean;
  confirm_token: string;
  unsubscribe_token: string;
  created_at: Date;
  confirmed_at: Date | null;
}

interface RawSubscriber {
  id: number;
  email: string;
  confirmed: number;
  confirm_token: string;
  unsubscribe_token: string;
  created_at: string;
  confirmed_at: string | null;
}

function parseSubscriber(row: RawSubscriber): Subscriber {
  return {
    ...row,
    confirmed: row.confirmed === 1,
    created_at: parseDate(row.created_at),
    confirmed_at: row.confirmed_at ? parseDate(row.confirmed_at) : null,
  };
}

export function insertSubscriber(
  db: Database.Database,
  email: string
): Subscriber {
  const confirmToken = randomUUID();
  const unsubscribeToken = randomUUID();

  db.prepare(
    `INSERT INTO subscribers (email, confirm_token, unsubscribe_token)
     VALUES (?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET
       confirm_token = CASE WHEN subscribers.confirmed = 0 THEN excluded.confirm_token ELSE subscribers.confirm_token END`
  ).run(email, confirmToken, unsubscribeToken);

  const row = db
    .prepare(`SELECT * FROM subscribers WHERE email = ?`)
    .get(email) as RawSubscriber;

  return parseSubscriber(row);
}

export function confirmSubscriber(
  db: Database.Database,
  token: string
): "confirmed" | "already_confirmed" | "not_found" {
  const row = db
    .prepare(`SELECT confirmed FROM subscribers WHERE confirm_token = ?`)
    .get(token) as { confirmed: number } | undefined;

  if (!row) return "not_found";
  if (row.confirmed === 1) return "already_confirmed";

  db.prepare(
    `UPDATE subscribers SET confirmed = 1, confirmed_at = datetime('now') WHERE confirm_token = ?`
  ).run(token);

  return "confirmed";
}

export function unsubscribe(
  db: Database.Database,
  token: string
): { status: "unsubscribed"; email: string } | { status: "not_found" } {
  const row = db
    .prepare(`SELECT id, email FROM subscribers WHERE unsubscribe_token = ?`)
    .get(token) as { id: number; email: string } | undefined;

  if (!row) return { status: "not_found" };

  db.prepare(`DELETE FROM notifications_sent WHERE subscriber_id = ?`).run(row.id);
  db.prepare(`DELETE FROM subscribers WHERE id = ?`).run(row.id);

  return { status: "unsubscribed", email: row.email };
}

export function getUnnotifiedSubscribers(
  db: Database.Database,
  slug: string
): Subscriber[] {
  const rows = db
    .prepare(
      `SELECT s.* FROM subscribers s
       WHERE s.confirmed = 1
         AND s.id NOT IN (SELECT subscriber_id FROM notifications_sent WHERE slug = ?)`
    )
    .all(slug) as RawSubscriber[];

  return rows.map(parseSubscriber);
}

export function recordNotification(
  db: Database.Database,
  slug: string,
  subscriberId: number
): void {
  db.prepare(
    `INSERT INTO notifications_sent (slug, subscriber_id) VALUES (?, ?)`
  ).run(slug, subscriberId);
}

export interface NotificationRecord {
  sent_at: Date;
  count: number;
}

export function getNotificationHistory(
  db: Database.Database,
  slug: string
): NotificationRecord[] {
  const rows = db
    .prepare(
      `SELECT sent_at, COUNT(*) as count
       FROM notifications_sent
       WHERE slug = ?
       GROUP BY sent_at
       ORDER BY sent_at DESC`
    )
    .all(slug) as Array<{ sent_at: string; count: number }>;

  return rows.map((row) => ({
    sent_at: parseDate(row.sent_at),
    count: row.count,
  }));
}
