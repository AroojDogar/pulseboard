import { Sparkline } from "./charts/Sparkline";

interface Props {
  label: string;
  value: string;
  /** signed change as a fraction (0.12 = +12%), or points for rates */
  delta: number | null;
  deltaText: string;
  goodWhenUp?: boolean;
  compareLabel: string;
  trend: number[];
}

export function StatTile({ label, value, delta, deltaText, goodWhenUp = true, compareLabel, trend }: Props) {
  const up = (delta ?? 0) > 0;
  const flat = delta === null || Math.abs(delta) < 1e-9;
  const good = flat ? null : up === goodWhenUp;

  return (
    <div className="fade-up rounded-2xl border border-line bg-surface p-5">
      <p className="text-sm text-ink-2">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-[28px] leading-none font-semibold tracking-tight">{value}</p>
        <Sparkline values={trend} />
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs">
        {flat ? (
          <span className="text-muted">No change</span>
        ) : (
          <span className={`inline-flex items-center gap-1 font-semibold ${good ? "text-up" : "text-down"}`}>
            {/* arrow carries direction, so meaning never relies on colour alone */}
            <svg viewBox="0 0 12 12" className={`h-3 w-3 ${up ? "" : "rotate-180"}`} aria-hidden="true">
              <path d="M6 2.5 10 7H7v2.5H5V7H2Z" fill="currentColor" />
            </svg>
            <span className="sr-only">{up ? "Up" : "Down"}</span>
            {deltaText}
          </span>
        )}
        <span className="text-muted">vs {compareLabel}</span>
      </p>
    </div>
  );
}
