// Demo dataset for "Fernway", a fictional project-management SaaS.
// Generated from a fixed seed, so the numbers are the same on every visit;
// only the calendar moves, so the dashboard always ends "today".

export type Plan = "starter" | "pro" | "business";
export type Status = "active" | "trial" | "churned";

export const PLANS: { id: Plan; name: string; price: number }[] = [
  { id: "starter", name: "Starter", price: 19 },
  { id: "pro", name: "Pro", price: 49 },
  { id: "business", name: "Business", price: 149 },
];
export const PLAN_BY_ID = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<Plan, (typeof PLANS)[number]>;

export const TRIAL_DAYS = 14;
export const HISTORY_DAYS = 900; // ~2.5 years, so "last 12 months" has a full previous year to compare with

const COUNTRIES: [string, number][] = [
  ["United States", 34], ["United Kingdom", 14], ["Germany", 10], ["Canada", 8], ["Australia", 6],
  ["Netherlands", 5], ["United Arab Emirates", 5], ["France", 4], ["Pakistan", 4], ["India", 4],
  ["Sweden", 3], ["Singapore", 3],
];
const CHANNELS: [string, number][] = [
  ["Organic search", 36], ["Referral", 22], ["Paid search", 18], ["Partners", 12], ["Social", 12],
];
const PLAN_MIX: [Plan, number][] = [["starter", 52], ["pro", 36], ["business", 12]];
/** chance a paying customer cancels in any given month */
const MONTHLY_CHURN: Record<Plan, number> = { starter: 0.045, pro: 0.026, business: 0.012 };

const FIRST = ["Olivia", "Liam", "Emma", "Noah", "Ava", "Elijah", "Sophia", "Lucas", "Mia", "Mateo", "Isla", "Leo", "Amelia", "Hamza", "Zara", "Yusuf", "Aisha", "Omar", "Layla", "Arjun", "Priya", "Lena", "Felix", "Hannah", "Jonas", "Chloe", "Ethan", "Grace", "Daniel", "Freya", "Sami", "Nora", "Ali", "Maya", "Theo", "Ivy"];
const LAST = ["Smith", "Johnson", "Brown", "Taylor", "Wilson", "Khan", "Ahmed", "Müller", "Schmidt", "Patel", "Singh", "Martin", "Lee", "Walker", "Hughes", "Clarke", "Evans", "Bakker", "de Vries", "Nguyen", "Garcia", "Rossi", "Andersson", "Haddad", "Malik", "Chen", "Kim", "Fischer", "Wright", "Lopez"];
const COMPANY_A = ["Blue", "North", "Bright", "Silver", "Urban", "Green", "Swift", "Clear", "Pixel", "Harbor", "Summit", "Maple", "Atlas", "Nova", "Orbit", "Cedar", "Copper", "Lumen", "Rapid", "Velvet"];
const COMPANY_B = ["Labs", "Studio", "Works", "Digital", "Partners", "Logistics", "Health", "Media", "Systems", "Ventures", "Foods", "Legal", "Build", "Design", "Analytics", "Retail", "Travel", "Energy"];

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: Plan;
  country: string;
  channel: string;
  signupDay: number; // index into the day range, 0 = oldest
  churnDay: number | null; // day they cancelled, if they did
  seats: number;
}

export interface Dataset {
  today: Date; // UTC midnight of the last day
  days: number;
  customers: Customer[];
  /** daily totals per plan, index = day */
  daily: Record<Plan, { mrr: Float64Array; paying: Int32Array; trials: Int32Array; signups: Int32Array; churned: Int32Array }>;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weighted<T>(rand: () => number, items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of items) if ((r -= w) < 0) return v;
  return items[items.length - 1][0];
}

function poisson(rand: () => number, mean: number): number {
  const L = Math.exp(-mean);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rand();
  } while (p > L);
  return k - 1;
}

export function dayToDate(ds: Dataset, day: number): Date {
  return new Date(ds.today.getTime() - (ds.days - 1 - day) * 86_400_000);
}

export function customerStatus(c: Customer, day: number): Status {
  if (c.churnDay !== null && c.churnDay <= day) return "churned";
  if (day < c.signupDay + TRIAL_DAYS) return "trial";
  return "active";
}

export function buildDataset(now = new Date()): Dataset {
  const rand = mulberry32(42);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const days = HISTORY_DAYS;
  const customers: Customer[] = [];

  for (let d = 0; d < days; d++) {
    const progress = d / days;
    const weekday = (today.getUTCDay() - (days - 1 - d) + 7 * 1000) % 7;
    const weekdayFactor = weekday === 0 || weekday === 6 ? 0.6 : 1.1;
    // steady growth with a launch bump around two-thirds through
    const bump = Math.exp(-((d - days * 0.8) ** 2) / 150) * 5;
    const mean = (1.6 + 6.2 * progress ** 1.35 + bump) * weekdayFactor;

    for (let i = poisson(rand, mean); i > 0; i--) {
      const plan = weighted(rand, PLAN_MIX);
      const first = FIRST[Math.floor(rand() * FIRST.length)];
      const last = LAST[Math.floor(rand() * LAST.length)];
      const company = `${COMPANY_A[Math.floor(rand() * COMPANY_A.length)]} ${COMPANY_B[Math.floor(rand() * COMPANY_B.length)]}`;
      const domain = company.toLowerCase().replace(/[^a-z]/g, "");

      // Days until cancel: geometric with a daily hazard, starting after the trial
      const hazard = MONTHLY_CHURN[plan] / 30;
      const lifetime = Math.ceil(Math.log(1 - rand()) / Math.log(1 - hazard));
      const churnDay = d + TRIAL_DAYS + lifetime;

      customers.push({
        id: `cus_${(customers.length + 1).toString(36).padStart(4, "0")}`,
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, "")}@${domain}.example`,
        company,
        plan,
        country: weighted(rand, COUNTRIES),
        channel: weighted(rand, CHANNELS),
        signupDay: d,
        churnDay: churnDay < days ? churnDay : null,
        seats: plan === "business" ? 10 + Math.floor(rand() * 40) : plan === "pro" ? 3 + Math.floor(rand() * 8) : 1 + Math.floor(rand() * 3),
      });
    }
  }

  // Daily totals using difference arrays: O(customers + days)
  const daily = {} as Dataset["daily"];
  for (const p of PLANS) {
    daily[p.id] = {
      mrr: new Float64Array(days),
      paying: new Int32Array(days),
      trials: new Int32Array(days),
      signups: new Int32Array(days),
      churned: new Int32Array(days),
    };
  }
  const payDiff = Object.fromEntries(PLANS.map((p) => [p.id, new Int32Array(days + 1)])) as Record<Plan, Int32Array>;
  const trialDiff = Object.fromEntries(PLANS.map((p) => [p.id, new Int32Array(days + 1)])) as Record<Plan, Int32Array>;

  for (const c of customers) {
    const end = c.churnDay ?? days;
    const trialEnd = Math.min(c.signupDay + TRIAL_DAYS, end, days);
    trialDiff[c.plan][c.signupDay]++;
    trialDiff[c.plan][trialEnd]--;
    const payStart = c.signupDay + TRIAL_DAYS;
    if (payStart < end && payStart < days) {
      payDiff[c.plan][payStart]++;
      payDiff[c.plan][end]--;
    }
    daily[c.plan].signups[c.signupDay]++;
    if (c.churnDay !== null) daily[c.plan].churned[c.churnDay]++;
  }

  for (const p of PLANS) {
    let paying = 0;
    let trials = 0;
    for (let d = 0; d < days; d++) {
      paying += payDiff[p.id][d];
      trials += trialDiff[p.id][d];
      daily[p.id].paying[d] = paying;
      daily[p.id].trials[d] = trials;
      daily[p.id].mrr[d] = paying * p.price;
    }
  }

  return { today, days, customers, daily };
}
