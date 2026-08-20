/**
 * Formats a plain "YYYY-MM-DD" date string (no time component) using its
 * literal calendar date, not `new Date(str)` — which JS parses as UTC
 * midnight and then renders in the local timezone, shifting the displayed
 * date back a day for anyone west of UTC.
 */
/** Today's date as "YYYY-MM-DD" in the local timezone (not UTC). */
export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function formatDateLocal(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, options);
}
