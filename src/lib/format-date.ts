const LOCALE = "fr-FR";
const TIMEZONE = "Europe/Paris";

/**
 * Format a date string/Date to a locale date string with explicit timezone.
 * Prevents hydration mismatches between server (UTC) and client (local TZ).
 */
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(date).toLocaleDateString(LOCALE, {
    timeZone: TIMEZONE,
    ...options,
  });
}

/**
 * Format a date string/Date to HH:MM with explicit timezone.
 */
export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString(LOCALE, {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a date string/Date to a full date+time string with explicit timezone.
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString(LOCALE, { timeZone: TIMEZONE });
}
