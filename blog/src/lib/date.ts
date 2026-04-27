/**
 * Absolute short date, used for blog post publication dates.
 * Omits the year when it matches `referenceYear` (defaults to the current year),
 * so a post from this year reads "Mar 15" and one from a previous year reads "Mar 15, 2024".
 */
export function shortDate(
  d: Date,
  referenceYear: number = new Date().getFullYear()
): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== referenceYear ? "numeric" : undefined,
  });
}

/**
 * Relative "time since" string: "just now", "5m ago", "3h ago", "2d ago",
 * falling back to `shortDate` for anything older than ~30 days.
 *
 * `now` defaults to the current clock time; tests pass an explicit Date for determinism.
 */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return shortDate(date, now.getFullYear());
}
