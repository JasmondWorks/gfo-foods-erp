export const LOCALE = "en-NG";
export const CURRENCY = "NGN";
export const TIME_ZONE = "Africa/Lagos";

const nairaFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** ₦12,500 — thousands separators, kobo only when meaningful. */
export function formatNaira(value: number | string): string {
  return nairaFormatter.format(Number(value));
}

const qtyFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

export function formatQty(value: number | string, unit?: string): string {
  const n = qtyFormatter.format(Number(value));
  return unit ? `${n} ${unit.toLowerCase()}` : n;
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(new Date(date));
}

/** "3 days ago" — powers the dashboard last-entry nudge. */
export function relativeDays(date: Date | string): string {
  const then = new Date(date).getTime();
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

/** yyyy-mm-dd in Africa/Lagos — the default value for every date input. */
export function todayInputValue(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}
