"use client";

import { useState } from "react";

interface Props {
  items: { name: string; value: number }[];
  format: (n: number) => string;
  color?: string;
  ariaLabel: string;
}

/** One series → one colour for every bar; value sits at the bar tip */
export function HBars({ items, format, color = "var(--color-accent)", ariaLabel }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((s, i) => s + i.value, 0);

  return (
    <ul className="space-y-2.5" aria-label={ariaLabel}>
      {items.map((it, i) => {
        const pct = (it.value / max) * 100;
        return (
          <li
            key={it.name}
            tabIndex={0}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            className="group grid grid-cols-[7.5rem_1fr] items-center gap-3 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent sm:grid-cols-[9rem_1fr]"
          >
            <span className="truncate text-ink-2">{it.name}</span>
            <span className="flex items-center gap-2">
              <span className="relative h-3 flex-1">
                <span
                  data-series
                  className="absolute inset-y-0 left-0 rounded-e-[4px] transition-[filter,width] duration-300"
                  style={{ width: `${pct}%`, background: color, filter: hover === i ? "brightness(1.12)" : undefined }}
                />
              </span>
              <span className="tabular w-24 shrink-0 text-end text-ink">
                {format(it.value)}
                <span className={`ms-1.5 text-xs text-muted ${hover === i ? "" : "max-sm:hidden"}`}>
                  {total ? `${Math.round((it.value / total) * 100)}%` : ""}
                </span>
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
