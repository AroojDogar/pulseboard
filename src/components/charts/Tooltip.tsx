"use client";

export interface TooltipRow {
  key: string;
  label: string;
  value: string;
  color: string; // CSS colour for the line key
}

/** Values lead, labels follow; series keyed with a short stroke, not a box */
export function Tooltip({ x, y, width, title, rows }: { x: number; y: number; width: number; title: string; rows: TooltipRow[] }) {
  const boxW = 190;
  const left = x + 14 + boxW > width ? x - 14 - boxW : x + 14;
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 rounded-lg border border-line bg-raised px-3 py-2 text-xs shadow-lg"
      style={{ left: Math.max(0, left), top: Math.max(0, y), width: boxW }}
    >
      <p className="mb-1.5 font-medium text-ink-2">{title}</p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-2">
            <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: r.color }} aria-hidden="true" />
            <span className="tabular font-semibold text-ink">{r.value}</span>
            <span className="truncate text-muted">{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
