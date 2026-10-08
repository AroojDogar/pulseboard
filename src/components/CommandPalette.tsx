"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDataset } from "./DataProvider";
import { PLAN_BY_ID } from "@/lib/data";

type Item = { id: string; label: string; hint: string; href: string };

const PAGES: Item[] = [
  { id: "p-overview", label: "Overview", hint: "Page", href: "/" },
  { id: "p-customers", label: "Customers", hint: "Page", href: "/customers" },
  { id: "p-12m", label: "Revenue, last 12 months", hint: "Report", href: "/?range=12m" },
  { id: "p-churned", label: "Churned customers", hint: "Filter", href: "/customers?status=churned" },
  { id: "p-trials", label: "Customers in trial", hint: "Filter", href: "/customers?status=trial" },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ds = useDataset();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => input.current?.focus(), 0);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const term = q.trim().toLowerCase();
    const pages = PAGES.filter((p) => !term || p.label.toLowerCase().includes(term));
    if (!term || !ds) return pages;
    const people = ds.customers
      .filter((c) => c.name.toLowerCase().includes(term) || c.company.toLowerCase().includes(term) || c.email.includes(term))
      .slice(-8)
      .reverse()
      .map((c) => ({ id: c.id, label: `${c.name} · ${c.company}`, hint: PLAN_BY_ID[c.plan].name, href: `/customers?id=${c.id}` }));
    return [...pages, ...people];
  }, [q, ds]);

  if (!open) return null;

  function go(item?: Item) {
    if (!item) return;
    router.push(item.href);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[12vh]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="fade-up w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-raised shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={input}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(items.length - 1, a + 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            }
            if (e.key === "Enter") go(items[active]);
          }}
          placeholder="Search pages, customers or companies…"
          aria-label="Search"
          className="w-full border-b border-line bg-transparent px-5 py-4 outline-none placeholder:text-muted"
        />
        <ul className="max-h-80 overflow-y-auto p-2" role="listbox">
          {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No results</li>}
          {items.map((it, i) => (
            <li
              key={it.id}
              role="option"
              aria-selected={i === active}
              onPointerEnter={() => setActive(i)}
              onClick={() => go(it)}
              className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm ${i === active ? "bg-accent/10" : ""}`}
            >
              <span className="truncate">{it.label}</span>
              <span className="ms-3 shrink-0 text-xs text-muted">{it.hint}</span>
            </li>
          ))}
        </ul>
        <p className="border-t border-line px-4 py-2 text-[11px] text-muted">↑ ↓ to move · Enter to open · Esc to close</p>
      </div>
    </div>
  );
}
