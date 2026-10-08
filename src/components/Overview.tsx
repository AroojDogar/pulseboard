"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDataset } from "./DataProvider";
import { Filters } from "./Filters";
import { StatTile } from "./StatTile";
import { ChartCard } from "./ChartCard";
import { LineChart } from "./charts/LineChart";
import { DivergingColumns } from "./charts/DivergingColumns";
import { HBars } from "./charts/HBars";
import { StatusBadge, PlanDot } from "./Badges";
import { PLAN_BY_ID, dayToDate, type Plan } from "@/lib/data";
import { RANGES, buildReport, pctChange, type PlanFilter, type Range } from "@/lib/metrics";
import { count, dateFmt, money, money2, moneyCompact, percent } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";

const PLAN_COLOR: Record<Plan, string> = { starter: "var(--color-s1)", pro: "var(--color-s2)", business: "var(--color-s3)" };
const COMPARE: Record<Range, string> = { "7d": "previous 7 days", "30d": "previous 30 days", "90d": "previous 90 days", "12m": "previous 12 months" };

const isRange = (v: string | null): v is Range => RANGES.some((r) => r.id === v);
const isPlan = (v: string | null): v is PlanFilter => v === "all" || v === "starter" || v === "pro" || v === "business";

const signed = (n: number | null, digits = 1) => (n === null ? "—" : `${n >= 0 ? "+" : "−"}${Math.abs(n * 100).toFixed(digits)}%`);

export function Overview() {
  const ds = useDataset();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const range: Range = isRange(params.get("range")) ? (params.get("range") as Range) : "30d";
  const plan: PlanFilter = isPlan(params.get("plan")) ? (params.get("plan") as PlanFilter) : "all";

  // Filters live in the URL, so any view can be shared as a link
  function setParam(key: string, value: string, fallback: string) {
    const next = new URLSearchParams(params);
    if (value === fallback) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const report = useMemo(() => (ds ? buildReport(ds, range, plan) : null), [ds, range, plan]);

  if (!ds || !report) return <Skeleton />;

  const { kpis, buckets } = report;
  const labels = buckets.map((b) => b.label);
  const titles = buckets.map((b) => b.title);
  const planName = plan === "all" ? "All plans" : PLAN_BY_ID[plan].name;
  const rangeLabel = RANGES.find((r) => r.id === range)!.label;

  const mrrSeries =
    plan === "all"
      ? report.mrrByPlan.map((s) => ({ key: s.plan, name: PLAN_BY_ID[s.plan].name, color: PLAN_COLOR[s.plan], values: s.values }))
      : [{ key: plan, name: `${PLAN_BY_ID[plan].name} MRR`, color: PLAN_COLOR[plan], values: report.mrrByPlan[0].values }];

  const churnDeltaPts = kpis.churnRate.value - kpis.churnRate.previous;

  function exportCsv() {
    downloadCsv(
      `pulseboard-${range}-${plan}.csv`,
      ["Period", "MRR (end)", ...report!.mrrByPlan.map((s) => `${PLAN_BY_ID[s.plan].name} MRR`), "Paying customers", "New signups", "Churned", "Monthly churn"],
      buckets.map((b, i) => [
        b.title,
        report!.kpis.mrr.trend[i],
        ...report!.mrrByPlan.map((s) => s.values[i]),
        report!.kpis.customers.trend[i],
        report!.movement.signups[i],
        report!.movement.churned[i],
        (report!.kpis.churnRate.trend[i] * 100).toFixed(2) + "%",
      ]),
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-ink-2">
            {planName} · {rangeLabel.toLowerCase()} · data through {dateFmt.format(dayToDate(ds, ds.days - 1))}
          </p>
        </div>
      </div>

      <Filters
        range={range}
        plan={plan}
        onRange={(r) => setParam("range", r, "30d")}
        onPlan={(p) => setParam("plan", p, "all")}
        onExport={exportCsv}
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Monthly recurring revenue"
          value={moneyCompact(kpis.mrr.value)}
          delta={pctChange(kpis.mrr.value, kpis.mrr.previous)}
          deltaText={signed(pctChange(kpis.mrr.value, kpis.mrr.previous))}
          compareLabel={`${range} ago`}
          trend={kpis.mrr.trend}
        />
        <StatTile
          label="Paying customers"
          value={count(kpis.customers.value)}
          delta={pctChange(kpis.customers.value, kpis.customers.previous)}
          deltaText={signed(pctChange(kpis.customers.value, kpis.customers.previous))}
          compareLabel={`${range} ago`}
          trend={kpis.customers.trend}
        />
        <StatTile
          label="New signups"
          value={count(kpis.signups.value)}
          delta={pctChange(kpis.signups.value, kpis.signups.previous)}
          deltaText={signed(pctChange(kpis.signups.value, kpis.signups.previous))}
          compareLabel={COMPARE[range]}
          trend={kpis.signups.trend}
        />
        <StatTile
          label="Monthly churn"
          value={percent(kpis.churnRate.value, 2)}
          delta={churnDeltaPts}
          deltaText={`${churnDeltaPts >= 0 ? "+" : "−"}${Math.abs(churnDeltaPts * 100).toFixed(2)} pts`}
          goodWhenUp={false}
          compareLabel={COMPARE[range]}
          trend={kpis.churnRate.trend}
        />
      </div>

      <div className={`grid gap-4 lg:grid-cols-3`}>
        <ChartCard
          className="lg:col-span-2"
          title="Monthly recurring revenue"
          subtitle={`${plan === "all" ? "By plan" : planName} · ARPU ${money2(kpis.arpu.value)}`}
          legend={plan === "all" ? mrrSeries.map((s) => ({ name: s.name, color: s.color })) : undefined}
          table={{
            columns: ["Period", ...mrrSeries.map((s) => s.name), ...(plan === "all" ? ["Total"] : [])],
            rows: buckets.map((b, i) => [
              b.title,
              ...mrrSeries.map((s) => money(s.values[i])),
              ...(plan === "all" ? [money(kpis.mrr.trend[i])] : []),
            ]),
          }}
        >
          <LineChart
            series={mrrSeries}
            labels={labels}
            titles={titles}
            format={money}
            axisFormat={moneyCompact}
            area={plan !== "all"}
            ariaLabel={`Line chart of monthly recurring revenue, ${rangeLabel.toLowerCase()}`}
          />
        </ChartCard>

        <ChartCard
          title="MRR by country"
          subtitle="Paying customers today"
          table={{ columns: ["Country", "MRR"], rows: report.countries.map((c) => [c.name, money(c.value)]) }}
        >
          <HBars items={report.countries} format={moneyCompact} ariaLabel="MRR by country" />
        </ChartCard>

        <ChartCard
          className="lg:col-span-2"
          title="Customer movement"
          subtitle={`Signups vs cancellations · net ${kpis.signups.value - report.movement.churned.reduce((a, b) => a + b, 0) >= 0 ? "+" : "−"}${count(Math.abs(kpis.signups.value - report.movement.churned.reduce((a, b) => a + b, 0)))}`}
          legend={[
            { name: "New signups", color: "var(--color-pos)", shape: "rect" },
            { name: "Churned", color: "var(--color-neg)", shape: "rect" },
          ]}
          table={{
            columns: ["Period", "New signups", "Churned", "Net"],
            rows: buckets.map((b, i) => [b.title, report.movement.signups[i], report.movement.churned[i], report.movement.signups[i] - report.movement.churned[i]]),
          }}
        >
          <DivergingColumns
            up={{ name: "New signups", color: "var(--color-pos)", values: report.movement.signups }}
            down={{ name: "Churned", color: "var(--color-neg)", values: report.movement.churned }}
            labels={labels}
            titles={titles}
            ariaLabel="Column chart of new signups above the line and churned customers below it"
          />
        </ChartCard>

        <ChartCard
          title="Signups by channel"
          subtitle={rangeLabel}
          table={{ columns: ["Channel", "Signups"], rows: report.channels.map((c) => [c.name, c.value]) }}
        >
          <HBars items={report.channels} format={count} ariaLabel="Signups by acquisition channel" />
        </ChartCard>
      </div>

      {/* Recent signups */}
      <section className="rounded-2xl border border-line bg-surface">
        <header className="flex items-center justify-between px-5 pt-5">
          <h2 className="font-semibold">Latest signups</h2>
          <Link href="/customers" className="text-sm font-medium text-accent hover:underline">
            All customers →
          </Link>
        </header>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="px-5 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 font-medium">Plan</th>
                <th className="px-3 py-2 font-medium">Country</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-5 py-2 text-right font-medium">Signed up</th>
              </tr>
            </thead>
            <tbody>
              {report.recent.map((c) => (
                <tr key={c.id} className="border-t border-line hover:bg-page">
                  <td className="px-5 py-2.5">
                    <Link href={`/customers?id=${c.id}`} className="font-medium hover:text-accent">
                      {c.name}
                    </Link>
                    <p className="text-xs text-muted">{c.company}</p>
                  </td>
                  <td className="px-3 py-2.5"><PlanDot plan={c.plan} /></td>
                  <td className="px-3 py-2.5 text-ink-2">{c.country}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                  <td className="tabular px-5 py-2.5 text-right text-ink-2">{dateFmt.format(dayToDate(ds, c.signupDay))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-12 w-60 animate-pulse rounded-lg bg-surface" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl border border-line bg-surface" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl border border-line bg-surface" />
    </div>
  );
}
