import type { NotificationRecord } from "./api.js";
import { timeAgo } from "../date.js";

export function renderNotificationHistory(
  history: NotificationRecord[],
  now: Date = new Date()
): string {
  if (history.length === 0) {
    return '<p class="status">No notifications sent yet.</p>';
  }

  return history
    .map((h) => {
      const date = timeAgo(h.sent_at, now);
      const plural = h.count !== 1 ? "s" : "";
      return `<p class="history-entry">${date} — sent to ${h.count} subscriber${plural}</p>`;
    })
    .join("");
}

export function renderSendResult(sent: number): string {
  const plural = sent !== 1 ? "s" : "";
  return `Sent to ${sent} subscriber${plural}.`;
}
