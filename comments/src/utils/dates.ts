export function parseDate(value: string): Date {
  return new Date(value + "Z");
}

export function formatDate(date: Date): string {
  return date.toISOString().replace("T", " ").replace("Z", "").split(".")[0];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function daysFrom(days: number, date: Date = new Date()): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}
