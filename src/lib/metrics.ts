// Turns the daily dataset into what the dashboard shows for a date range and plan filter.

import { PLANS, customerStatus, dayToDate, type Customer, type Dataset, type Plan } from "./data";

export type Range = "7d" | "30d" | "90d" | "12m";
export type PlanFilter = Plan | "all";

export const RANGES: { id: Range; label: string; days: number }[] = [
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
  { id: "12m", label: "Last 12 months", days: 365 },
];

export interface Bucket {
  label: string; // axis label
  title: string; // tooltip title
  start: number; // first day index (inclusive)
  end: number; // last day index (inclusive)
}

export interface Kpi {
  value: number;
  previous: number;
  trend: number[]; // one value per bucket
}

export interface Report {
  range: Range;
  plan: PlanFilter;
  buckets: Bucket[];
  kpis: { mrr: Kpi; customers: Kpi; signups: Kpi; churnRate: Kpi; arpu: Kpi };
  mrrByPlan: { plan: Plan; values: number[] }[]; // value at the end of each bucket
  movement: { signups: number[]; churned: number[] }; // per bucket
  channels: { name: string; value: number }[];
  countries: { name: string; value: number }[]; // current MRR
  recent: (Customer & { status: ReturnType<typeof customerStatus> })[];
}

const fmtDay = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", timeZone: "UTC" });
const fmtMonth = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const fmtMonthYear = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

function makeBuckets(ds: Dataset, range: Range): Bucket[] {
  const last = ds.days - 1;
  const days = RANGES.find((r) => r.id === range)!.days;
  const first = last - days + 1;

  if (range === "7d" || range === "30d") {
    return Array.from({ length: days }, (_, i) => {
      const d = first + i;
      const label = fmtDay.format(dayToDate(ds, d));
      return { label, title: label, start: d, end: d };
    });
  }
  if (range === "90d") {
    // 13 weeks, ending today
    return Array.from({ length: 13 }, (_, i) => {
      const end = last - (12 - i) * 7;
      const start = Math.max(first, end - 6);
      return {
        label: fmtDay.format(dayToDate(ds, start)),
        title: `Week of ${fmtDay.format(dayToDate(ds, start))}`,
        start,
        end,
      };
    });
  }
  // 12 calendar months, the last one is month-to-date
  const buckets: Bucket[] = [];
  const today = dayToDate(ds, last);
  for (let m = 11; m >= 0; m--) {
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - m, 1));
    const monthEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - m + 1, 0));
    const toDay = (d: Date) => last - Math.round((today.getTime() - d.getTime()) / 86_400_000);
    buckets.push({
      label: fmtMonth.format(monthStart),
      title: m === 0 ? `${fmtMonthYear.format(monthStart)} (to date)` : fmtMonthYear.format(monthStart),
      start: Math.max(0, toDay(monthStart)),
      end: Math.min(last, toDay(monthEnd)),
    });
  }
  return buckets;
}

const plansFor = (plan: PlanFilter): Plan[] => (plan === "all" ? PLANS.map((p) => p.id) : [plan]);

export function buildReport(ds: Dataset, range: Range, plan: PlanFilter): Report {
  const plans = plansFor(plan);
  const days = RANGES.find((r) => r.id === range)!.days;
  const last = ds.days - 1;
  const start = last - days + 1; // first day of the period
  const prevStart = start - days;

  const at = (key: "mrr" | "paying", d: number) => plans.reduce((s, p) => s + ds.daily[p][key][Math.max(0, d)], 0);
  const sum = (key: "signups" | "churned", from: number, to: number) => {
    let s = 0;
    for (const p of plans) for (let d = Math.max(0, from); d <= to; d++) s += ds.daily[p][key][d];
    return s;
  };

  const buckets = makeBuckets(ds, range);

  const mrrNow = at("mrr", last);
  const mrrThen = at("mrr", start - 1);
  const payingNow = at("paying", last);
  const payingThen = at("paying", start - 1);

  // Monthly churn = customers lost ÷ average paying customers, scaled to a 30-day month,
  // so 7-day and 12-month views are comparable
  const avgPaying = (from: number, to: number) => {
    let s = 0;
    for (let d = from; d <= to; d++) s += at("paying", d);
    return s / (to - from + 1);
  };
  const monthlyChurn = (from: number, to: number) => {
    const base = avgPaying(from, to);
    return base ? (sum("churned", from, to) / base) * (30 / (to - from + 1)) : 0;
  };

  const arpu = (mrr: number, paying: number) => (paying ? mrr / paying : 0);

  const kpis: Report["kpis"] = {
    mrr: { value: mrrNow, previous: mrrThen, trend: buckets.map((b) => at("mrr", b.end)) },
    customers: { value: payingNow, previous: payingThen, trend: buckets.map((b) => at("paying", b.end)) },
    signups: {
      value: sum("signups", start, last),
      previous: sum("signups", prevStart, start - 1),
      trend: buckets.map((b) => sum("signups", b.start, b.end)),
    },
    churnRate: {
      value: monthlyChurn(start, last),
      previous: monthlyChurn(prevStart, start - 1),
      trend: buckets.map((b) => monthlyChurn(b.start, b.end)),
    },
    arpu: {
      value: arpu(mrrNow, payingNow),
      previous: arpu(mrrThen, payingThen),
      trend: buckets.map((b) => arpu(at("mrr", b.end), at("paying", b.end))),
    },
  };

  const mrrByPlan = plans.map((p) => ({ plan: p, values: buckets.map((b) => ds.daily[p].mrr[b.end]) }));

  const movement = {
    signups: buckets.map((b) => sum("signups", b.start, b.end)),
    churned: buckets.map((b) => sum("churned", b.start, b.end)),
  };

  // Signups by channel within the period
  const inPlan = ds.customers.filter((c) => plans.includes(c.plan));
  const channelMap = new Map<string, number>();
  for (const c of inPlan) if (c.signupDay >= start) channelMap.set(c.channel, (channelMap.get(c.channel) ?? 0) + 1);
  const channels = [...channelMap].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Current MRR by country: top 6, the rest folded into "Other"
  const countryMap = new Map<string, number>();
  const price = Object.fromEntries(PLANS.map((p) => [p.id, p.price]));
  for (const c of inPlan) {
    if (customerStatus(c, last) === "active") countryMap.set(c.country, (countryMap.get(c.country) ?? 0) + price[c.plan]);
  }
  const sorted = [...countryMap].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const countries = sorted.slice(0, 6);
  const other = sorted.slice(6).reduce((s, c) => s + c.value, 0);
  if (other > 0) countries.push({ name: "Other", value: other });

  const recent = inPlan
    .slice(-6)
    .reverse()
    .map((c) => ({ ...c, status: customerStatus(c, last) }));

  return { range, plan, buckets, kpis, mrrByPlan, movement, channels, countries, recent };
}

/** % change, or null when there is nothing to compare with */
export function pctChange(now: number, before: number): number | null {
  if (!before) return null;
  return (now - before) / before;
}
