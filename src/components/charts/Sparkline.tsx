/** Small trend line: history in a muted tone, the latest point in the accent */
export function Sparkline({ values, width = 112, height = 32 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => (i / (values.length - 1)) * (width - 6) + 1;
  const y = (v: number) => height - 4 - ((v - min) / span) * (height - 8);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const last = values.length - 1;
  return (
    <svg width={width} height={height} aria-hidden="true" className="overflow-visible">
      <path d={d} fill="none" stroke="var(--color-muted)" strokeOpacity={0.55} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last)} cy={y(values[last])} r={3} fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth={1.5} />
    </svg>
  );
}
