"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDataset } from "./DataProvider";
import { PlanDot, StatusBadge } from "./Badges";
import { PLANS, PLAN_BY_ID, TRIAL_DAYS, customerStatus, dayToDate, type Customer, type Dataset, type Plan, type Status } from "@/lib/data";
import { count, dateFmt, money } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";

type SortKey = "name" | "mrr" | "signup" | "ltv";
type Row = Customer & { status: Status; mrr: number; ltv: number; months: number };

const PAGE_SIZE = 20;

function toRow(ds: Dataset, c: Customer): Row {
  const last = ds.days - 1;
  const status = customerStatus(c, last);
  const price = PLAN_BY_ID[c.plan].price;
  const paidDays = Math.max(0, Math.min(c.churnDay ?? last + 1, last + 1) - (c.signupDay + TRIAL_DAYS));
  const months = Math.ceil(paidDays / 30);
  return { ...c, status, mrr: status === "active" ? price : 0, ltv: months * price, months };
}

export function Customers() {
  const ds = useDataset();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [q, setQ] = useState("");
  const [plan, setPlan] = useState<Plan | "all">("all");
  const [status, setStatus] = useState<Status | "all">(() => {
    const s = params.get("status");
    return s === "active" || s === "trial" || s === "churned" ? s : "all";
  });
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "ltv", dir: -1 });
  const [page, setPage] = useState(0);

  const selectedId = params.get("id");

  useEffect(() => {
    const s = params.get("status");
    if (s === "active" || s === "trial" || s === "churned") setStatus(s);
  }, [params]);

  const rows = useMemo(() => (ds ? ds.customers.map((c) => toRow(ds, c)) : []), [ds]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = rows.filter(
      (r) =>
        (plan === "all" || r.plan === plan) &&
        (status === "all" || r.status === status) &&
        (!term || r.name.toLowerCase().includes(term) || r.company.toLowerCase().includes(term) || r.email.includes(term) || r.country.toLowerCase().includes(term)),
    );
    const val = (r: Row) => (sort.key === "name" ? r.name : sort.key === "mrr" ? r.mrr : sort.key === "ltv" ? r.ltv : r.signupDay);
    return list.sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      return (typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number)) * sort.dir;
    });
  }, [rows, q, plan, status, sort]);

  useEffect(() => setPage(0), [q, plan, status, sort]);

  if (!ds) return <div className="mx-auto h-96 max-w-7xl animate-pulse rounded-2xl border border-line bg-surface" aria-busy="true" />;

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const selected = selectedId ? rows.find((r) => r.id === selectedId) ?? null : null;
  const counts = { active: 0, trial: 0, churned: 0 } as Record<Status, number>;
  for (const r of rows) counts[r.status]++;
  const filteredMrr = filtered.reduce((s, r) => s + r.mrr, 0);

  function open(id: string | null) {
    const next = new URLSearchParams(params);
    if (id) next.set("id", id);
    else next.delete("id");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function sortBy(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "name" ? 1 : -1 }));
  }

  function exportCsv() {
    downloadCsv(
      "pulseboard-customers.csv",
      ["ID", "Name", "Email", "Company", "Plan", "Status", "MRR", "Lifetime value", "Seats", "Country", "Channel", "Signed up", "Cancelled"],
      filtered.map((r) => [
        r.id, r.name, r.email, r.company, PLAN_BY_ID[r.plan].name, r.status, r.mrr, r.ltv, r.seats, r.country, r.channel,
        dateFmt.format(dayToDate(ds!, r.signupDay)),
        r.churnDay !== null ? dateFmt.format(dayToDate(ds!, r.churnDay)) : "",
      ]),
    );
  }

  const th = (key: SortKey, label: string, right = false) => (
    <th className={`px-3 py-2.5 font-medium ${right ? "text-right" : ""}`} aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button onClick={() => sortBy(key)} className="inline-flex items-center gap-1 hover:text-ink">
        {label}
        <span aria-hidden="true" className={sort.key === key ? "text-ink" : "opacity-30"}>
          {sort.key === key && sort.dir === 1 ? "↑" : "↓"}
        </span>
      </button>
    </th>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="mt-1 text-sm text-ink-2">
          {count(counts.active)} active · {count(counts.trial)} in trial · {count(counts.churned)} churned
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1 sm:max-w-xs">
          <span className="sr-only">Search customers</span>
          <svg viewBox="0 0 24 24" className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, company, email or country"
            className="w-full rounded-lg border border-line bg-surface py-1.5 ps-9 pe-3 text-sm outline-none focus:border-accent"
          />
        </label>
        <select value={plan} onChange={(e) => setPlan(e.target.value as Plan | "all")} aria-label="Plan" className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm">
          <option value="all">All plans</option>
          {PLANS.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div role="radiogroup" aria-label="Status" className="flex rounded-lg border border-line bg-surface p-0.5 text-sm">
          {(["all", "active", "trial", "churned"] as const).map((s) => (
            <button
              key={s}
              role="radio"
              aria-checked={status === s}
              onClick={() => setStatus(s)}
              className={`rounded-md px-3 py-1 font-medium capitalize transition ${status === s ? "bg-ink text-page" : "text-ink-2 hover:bg-page"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <button onClick={exportCsv} className="ms-auto flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:bg-page">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" />
          </svg>
          Export {count(filtered.length)}
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-line text-left text-xs text-muted">
              <tr>
                <th className="w-0 px-0" />
                {th("name", "Customer")}
                <th className="px-3 py-2.5 font-medium">Plan</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Country</th>
                {th("mrr", "MRR", true)}
                {th("ltv", "Lifetime value", true)}
                {th("signup", "Signed up", true)}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-muted">No customers match these filters.</td>
                </tr>
              )}
              {visible.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => open(r.id)}
                  className={`cursor-pointer border-t border-line first:border-0 hover:bg-page ${selectedId === r.id ? "bg-accent/5" : ""}`}
                >
                  <td className="w-0 px-0" />
                  <td className="px-3 py-2.5">
                    <button onClick={(e) => { e.stopPropagation(); open(r.id); }} className="text-start">
                      <span className="block font-medium hover:text-accent">{r.name}</span>
                      <span className="block text-xs text-muted">{r.company}</span>
                    </button>
                  </td>
                  <td className="px-3 py-2.5"><PlanDot plan={r.plan} /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-2.5 text-ink-2">{r.country}</td>
                  <td className="tabular px-3 py-2.5 text-right">{r.mrr ? money(r.mrr) : <span className="text-muted">—</span>}</td>
                  <td className="tabular px-3 py-2.5 text-right text-ink-2">{money(r.ltv)}</td>
                  <td className="tabular px-3 py-2.5 text-right text-ink-2">{dateFmt.format(dayToDate(ds, r.signupDay))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm text-ink-2">
          <span className="tabular">
            {filtered.length ? `${page * PAGE_SIZE + 1}–${Math.min(filtered.length, (page + 1) * PAGE_SIZE)}` : 0} of {count(filtered.length)} · {money(filteredMrr)} MRR
          </span>
          <span className="flex items-center gap-2">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-line px-3 py-1 disabled:opacity-40 hover:enabled:bg-page">
              Previous
            </button>
            <span className="tabular text-xs">Page {page + 1} of {pages}</span>
            <button disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-line px-3 py-1 disabled:opacity-40 hover:enabled:bg-page">
              Next
            </button>
          </span>
        </footer>
      </section>

      {selected && <CustomerDrawer ds={ds} row={selected} onClose={() => open(null)} />}
    </div>
  );
}

function CustomerDrawer({ ds, row, onClose }: { ds: Dataset; row: Row; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const plan = PLAN_BY_ID[row.plan];
  const day = (d: number) => dateFmt.format(dayToDate(ds, d));
  const trialEnd = row.signupDay + TRIAL_DAYS;
  const last = ds.days - 1;

  const timeline = [
    { when: row.signupDay, text: `Signed up via ${row.channel.toLowerCase()} · ${plan.name} trial` },
    ...(trialEnd <= last && (row.churnDay === null || row.churnDay > trialEnd) ? [{ when: trialEnd, text: `Became a paying customer · ${money(plan.price)}/mo` }] : []),
    ...(row.churnDay !== null ? [{ when: row.churnDay, text: "Cancelled subscription" }] : []),
  ].reverse();

  const initials = row.name.split(" ").map((p) => p[0]).join("").slice(0, 2);

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={row.name}
        onClick={(e) => e.stopPropagation()}
        className="fade-up absolute inset-y-0 end-0 flex w-full max-w-md flex-col overflow-y-auto border-s border-line bg-surface p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-accent/15 font-semibold text-accent">{initials}</span>
            <div>
              <h2 className="text-lg font-semibold">{row.name}</h2>
              <p className="text-sm text-ink-2">{row.company}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-xl text-muted hover:bg-page hover:text-ink" aria-label="Close">
            ×
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <StatusBadge status={row.status} />
          <span className="text-xs text-muted">{row.id}</span>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3">
          {[
            ["MRR", row.mrr ? money(row.mrr) : "—"],
            ["Lifetime value", money(row.ltv)],
            ["Plan", `${plan.name} · ${money(plan.price)}/mo`],
            ["Seats", count(row.seats)],
            ["Months paid", count(row.months)],
            ["Country", row.country],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-line bg-page p-3">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="tabular mt-1 font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        <h3 className="mt-8 text-sm font-semibold">Contact</h3>
        <a href={`mailto:${row.email}`} className="mt-1 block truncate text-sm text-accent hover:underline">
          {row.email}
        </a>

        <h3 className="mt-8 text-sm font-semibold">Timeline</h3>
        <ol className="mt-3 space-y-4 border-s border-line ps-5">
          {timeline.map((t) => (
            <li key={t.when + t.text} className="relative">
              <span className="absolute top-1.5 -start-[25px] h-2.5 w-2.5 rounded-full border-2 border-surface bg-accent" aria-hidden="true" />
              <p className="text-sm">{t.text}</p>
              <p className="text-xs text-muted">{day(t.when)}</p>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
