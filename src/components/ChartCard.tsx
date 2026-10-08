"use client";

import { useState } from "react";

export interface TableData {
  columns: string[];
  rows: (string | number)[][];
}

interface Props {
  title: string;
  subtitle?: string;
  legend?: { name: string; color: string; shape?: "line" | "rect" }[];
  table: TableData; // every chart can be read as a table
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, legend, table, children, className = "" }: Props) {
  const [asTable, setAsTable] = useState(false);

  return (
    <section className={`rounded-2xl border border-line bg-surface p-5 ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-ink-2">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          {legend && legend.length > 1 && (
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
              {legend.map((l) => (
                <li key={l.name} className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={l.shape === "rect" ? "h-2.5 w-2.5 rounded-[3px]" : "h-0.5 w-3.5 rounded-full"}
                    style={{ background: l.color }}
                  />
                  {l.name}
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={() => setAsTable((v) => !v)}
            aria-pressed={asTable}
            className="rounded-md border border-line px-2 py-1 text-xs text-ink-2 hover:bg-page"
          >
            {asTable ? "Chart" : "Table"}
          </button>
        </div>
      </header>

      <div className="mt-4">
        {asTable ? (
          <div className="max-h-72 overflow-auto rounded-lg border border-line">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-raised text-left text-xs text-muted">
                <tr>
                  {table.columns.map((c, i) => (
                    <th key={c} className={`px-3 py-2 font-medium ${i ? "text-right" : ""}`}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="tabular">
                {table.rows.map((r, i) => (
                  <tr key={i} className="border-t border-line">
                    {r.map((cell, j) => (
                      <td key={j} className={`px-3 py-1.5 ${j ? "text-right" : "text-ink-2"}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
