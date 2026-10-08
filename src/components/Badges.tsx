import { PLAN_BY_ID, type Plan, type Status } from "@/lib/data";

const PLAN_COLOR: Record<Plan, string> = { starter: "var(--color-s1)", pro: "var(--color-s2)", business: "var(--color-s3)" };

export function PlanDot({ plan }: { plan: Plan }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2 w-2 rounded-full" style={{ background: PLAN_COLOR[plan] }} aria-hidden="true" />
      {PLAN_BY_ID[plan].name}
    </span>
  );
}

// Status pairs a symbol with the word, so it never depends on colour alone
const STATUS: Record<Status, { label: string; icon: React.ReactNode; className: string }> = {
  active: { label: "Active", icon: <circle cx="5" cy="5" r="4" fill="currentColor" />, className: "bg-up/10 text-up" },
  trial: {
    label: "Trial",
    icon: (
      <>
        <circle cx="5" cy="5" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 1.6a3.4 3.4 0 0 1 0 6.8Z" fill="currentColor" />
      </>
    ),
    className: "bg-accent/10 text-accent",
  },
  churned: { label: "Churned", icon: <circle cx="5" cy="5" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.3" />, className: "bg-down/10 text-down" },
};

export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}>
      <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" aria-hidden="true">{s.icon}</svg>
      {s.label}
    </span>
  );
}
