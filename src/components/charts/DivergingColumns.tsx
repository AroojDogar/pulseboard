"use client";

import { useState } from "react";
import { useWidth } from "./useSize";
import { Tooltip } from "./Tooltip";
import { count, niceMax } from "@/lib/format";

interface Props {
  up: { name: string; color: string; values: number[] };
  down: { name: string; color: string; values: number[] };
  labels: string[];
  titles: string[];
  height?: number;
  ariaLabel: string;
}

const M = { top: 12, right: 12, bottom: 28, left: 44 };

/** Gains above the baseline, losses below it — one shared axis */
export function DivergingColumns({ up, down, labels, titles, height = 240, ariaLabel }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const n = labels.length;
  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = height - M.top - M.bottom;
  const maxUp = niceMax(Math.max(1, ...up.values));
  const maxDown = niceMax(Math.max(1, ...down.values));
  // give each side space in proportion to its own scale on one linear axis
  const total = maxUp + maxDown;
  const zero = M.top + (maxUp / total) * plotH;
  const scale = plotH / total;

  const band = plotW / Math.max(1, n);
  const barW = Math.min(24, Math.max(2, band - 4));
  const cx = (i: number) => M.left + band * i + band / 2;
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 60))));

  const tickVals = [maxUp, maxUp / 2, 0, -maxDown / 2, -maxDown].filter((v, i, a) => a.indexOf(v) === i);
  const yOf = (v: number) => zero - v * scale;

  // 4px rounded data-end, square at the baseline
  const bar = (x: number, h: number, dir: 1 | -1) => {
    if (h <= 0) return "";
    const r = Math.min(4, h, barW / 2);
    const top = zero - dir * h;
    if (dir === 1) {
      return `M${x},${zero}V${top + r}Q${x},${top} ${x + r},${top}H${x + barW - r}Q${x + barW},${top} ${x + barW},${top + r}V${zero}Z`;
    }
    return `M${x},${zero}V${top - r}Q${x},${top} ${x + r},${top}H${x + barW - r}Q${x + barW},${top} ${x + barW},${top - r}V${zero}Z`;
  };

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel}>
          {tickVals.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={M.left + plotW} y1={yOf(t)} y2={yOf(t)} stroke={t === 0 ? "var(--color-axis)" : "var(--color-grid)"} strokeWidth={1} />
              <text x={M.left - 8} y={yOf(t)} dy="0.32em" textAnchor="end" className="tabular fill-muted text-[11px]">
                {t > 0 ? `+${count(t)}` : t < 0 ? `−${count(-t)}` : "0"}
              </text>
            </g>
          ))}

          {labels.map((l, i) => {
            const x = cx(i) - barW / 2;
            const dim = hover !== null && hover !== i;
            return (
              <g key={i} opacity={dim ? 0.45 : 1} style={{ transition: "opacity 120ms" }}>
                <path data-series d={bar(x, up.values[i] * scale - 1, 1)} fill={up.color} className="grow" style={{ transformOrigin: "bottom" }} />
                <path data-series d={bar(x, down.values[i] * scale - 1, -1)} fill={down.color} className="grow" style={{ transformOrigin: "top" }} />
                {(i === n - 1 || (i % every === 0 && n - 1 - i >= every * 0.6)) && (
                  <text x={cx(i)} y={height - 8} textAnchor="middle" className="fill-muted text-[11px]">
                    {l}
                  </text>
                )}
                {/* hit target: the whole band, focusable */}
                <rect
                  x={M.left + band * i}
                  y={M.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${titles[i]}: ${up.values[i]} ${up.name.toLowerCase()}, ${down.values[i]} ${down.name.toLowerCase()}`}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="outline-none"
                />
              </g>
            );
          })}
        </svg>
      )}
      {hover !== null && width > 0 && (
        <Tooltip
          x={cx(hover)}
          y={M.top}
          width={width}
          title={titles[hover]}
          rows={[
            { key: "up", label: up.name, value: `+${count(up.values[hover])}`, color: up.color },
            { key: "down", label: down.name, value: `−${count(down.values[hover])}`, color: down.color },
            { key: "net", label: "Net change", value: `${up.values[hover] - down.values[hover] >= 0 ? "+" : "−"}${count(Math.abs(up.values[hover] - down.values[hover]))}`, color: "transparent" },
          ]}
        />
      )}
    </div>
  );
}
