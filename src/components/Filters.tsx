"use client";

import { PLANS } from "@/lib/data";
import { RANGES, type PlanFilter, type Range } from "@/lib/metrics";

interface Props {
  range: Range;
  plan: PlanFilter;
  onRange: (r: Range) => void;
  onPlan: (p: PlanFilter) => void;
  onExport: () => void;
}

/** One row, above everything it scopes. Date range first. */
export function Filters({ range, plan, onRange, onPlan, onExport }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div role="radiogroup" aria-label="Date range" className="flex rounded-lg border border-line bg-surface p-0.5">
        {RANGES.map((r) => (
          <button
            key={r.id}
            role="radio"
            aria-checked={range === r.id}
            onClick={() => onRange(r.id)}
            title={r.label}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              range === r.id ? "bg-ink text-page" : "text-ink-2 hover:bg-page"
            }`}
          >
            {r.id}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-2">
        <span className="sr-only sm:not-sr-only">Plan</span>
        <select
          value={plan}
          onChange={(e) => onPlan(e.target.value as PlanFilter)}
          className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink"
        >
          <option value="all">All plans</option>
          {PLANS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · ${p.price}/mo
            </option>
          ))}
        </select>
      </label>

      <button
        onClick={onExport}
        className="ms-auto flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:bg-page"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" />
        </svg>
        Export CSV
      </button>
    </div>
  );
}
