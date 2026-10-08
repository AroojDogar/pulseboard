const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const int = new Intl.NumberFormat("en-US");

export const money = (n: number) => usd.format(n);
export const money2 = (n: number) => usd2.format(n);
export const moneyCompact = (n: number) => (Math.abs(n) >= 10_000 ? `$${compact.format(n)}` : usd.format(n));
export const count = (n: number) => int.format(Math.round(n));
export const countCompact = (n: number) => (Math.abs(n) >= 10_000 ? compact.format(n) : int.format(Math.round(n)));
export const percent = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;

export const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** Rounds an axis maximum up to a clean number that splits into 4 even ticks */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(value));
  const f = value / exp;
  const steps = [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10]; // all divide cleanly into 4 ticks
  return (steps.find((st) => f <= st) ?? 10) * exp;
}

export function ticks(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, i) => (max / count) * i);
}
