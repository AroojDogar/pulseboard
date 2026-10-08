"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { useWidth } from "./useSize";
import { Tooltip } from "./Tooltip";
import { niceMax, ticks } from "@/lib/format";

export interface LineSeries {
  key: string;
  name: string;
  color: string; // CSS var, e.g. var(--color-s1)
  values: number[];
}

interface Props {
  series: LineSeries[];
  labels: string[]; // x-axis labels
  titles: string[]; // tooltip titles
  format: (n: number) => string; // tooltip values
  axisFormat: (n: number) => string; // y-axis ticks
  height?: number;
  area?: boolean; // 10% wash under a single series
  ariaLabel: string;
}

const M = { top: 12, right: 64, bottom: 28, left: 52 };

export function LineChart({ series, labels, titles, format, axisFormat, height = 260, area, ariaLabel }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const n = labels.length;
  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = height - M.top - M.bottom;
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)) * 1.05);
  const x = (i: number) => M.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => M.top + plotH - (v / max) * plotH;

  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 64))));

  function onMove(e: PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    setHover(Math.max(0, Math.min(n - 1, Math.round((px / rect.width) * (n - 1)))));
  }

  function onKey(e: KeyboardEvent<SVGSVGElement>) {
    if (e.key === "ArrowRight") setHover((h) => Math.min(n - 1, (h ?? -1) + 1));
    else if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? n) - 1));
    else if (e.key === "Escape") setHover(null);
    else return;
    e.preventDefault();
  }

  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");

  // End labels, nudged apart only if they would overlap; drop them if they still collide
  const ends = series
    .map((s) => ({ s, yy: y(s.values[n - 1] ?? 0) }))
    .sort((a, b) => a.yy - b.yy);
  const placed = ends.map((e) => ({ ...e, ly: e.yy }));
  for (let i = 1; i < placed.length; i++) if (placed[i].ly - placed[i - 1].ly < 14) placed[i].ly = placed[i - 1].ly + 14;
  const showEnds = series.length > 1 && series.length <= 4 && placed.every((p) => Math.abs(p.ly - p.yy) < 10);

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
          className="outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
        >
          {/* grid + y ticks */}
          {ticks(max).map((t) => (
            <g key={t}>
              <line x1={M.left} x2={M.left + plotW} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--color-axis)" : "var(--color-grid)"} strokeWidth={1} />
              <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="tabular fill-muted text-[11px]">
                {axisFormat(t)}
              </text>
            </g>
          ))}
          {/* x labels */}
          {labels.map((l, i) =>
            i === n - 1 || (i % every === 0 && n - 1 - i >= every * 0.6) ? (
              <text key={i} x={x(i)} y={height - 8} textAnchor={i === n - 1 ? "end" : i === 0 ? "start" : "middle"} className="fill-muted text-[11px]">
                {l}
              </text>
            ) : null,
          )}

          {series.map((s) => (
            <g key={s.key} data-series>
              {area && series.length === 1 && (
                <path d={`${path(s.values)}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill={s.color} opacity={0.1} />
              )}
              <path
                d={path(s.values)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                className="draw-line"
                style={{ ["--len" as string]: `${plotW * 2.5}` }}
                pathLength={plotW * 2.5}
              />
              {/* end dot with a surface ring */}
              <circle cx={x(n - 1)} cy={y(s.values[n - 1] ?? 0)} r={4} fill={s.color} stroke="var(--color-surface)" strokeWidth={2} />
            </g>
          ))}

          {showEnds &&
            placed.map((p) => (
              <text key={p.s.key} x={x(n - 1) + 10} y={p.ly} dy="0.32em" className="fill-ink-2 text-[11px] font-medium">
                {p.s.name}
              </text>
            ))}

          {/* crosshair */}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={M.top + plotH} stroke="var(--color-axis)" strokeWidth={1} />
              {series.map((s) => (
                <circle key={s.key} cx={x(hover)} cy={y(s.values[hover])} r={4} fill={s.color} stroke="var(--color-surface)" strokeWidth={2} />
              ))}
            </g>
          )}

          {/* hit area bigger than the marks: the whole plot */}
          <rect
            x={M.left}
            y={M.top}
            width={plotW}
            height={plotH}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
      )}
      {hover !== null && width > 0 && (
        <Tooltip
          x={x(hover)}
          y={M.top}
          width={width}
          title={titles[hover]}
          rows={[...series]
            .sort((a, b) => b.values[hover] - a.values[hover])
            .map((s) => ({ key: s.key, label: s.name, value: format(s.values[hover]), color: s.color }))}
        />
      )}
    </div>
  );
}
