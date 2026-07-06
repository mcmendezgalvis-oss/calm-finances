import type { Lang } from "@/i18n/strings";

/**
 * Format any Date/ISO/monthKey as "Julio 2026" / "July 2026".
 * All app history normalizes to Month + Year granularity.
 */
export function formatMonthYear(input: Date | string, lang: Lang = "es"): string {
  const d = typeof input === "string" ? parseAnyDate(input) : input;
  const s = d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function parseAnyDate(s: string): Date {
  // Accept "YYYY-MM" (monthKey) or ISO
  if (/^\d{4}-\d{2}$/.test(s)) {
    const [y, m] = s.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }
  return new Date(s);
}

/** ISO for first day of the given month/year. */
export function firstOfMonthISO(year: number, month1to12: number): string {
  return new Date(year, month1to12 - 1, 1).toISOString();
}

/** Get monthKey "YYYY-MM" for a date/ISO. */
export function monthKeyFromDate(input: Date | string): string {
  const d = typeof input === "string" ? parseAnyDate(input) : input;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}