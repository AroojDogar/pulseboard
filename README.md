# 📈 PulseBoard — SaaS Analytics Dashboard

A fast, accessible analytics dashboard for a subscription business: revenue, customers, churn and growth channels in one place.

> Demo project: **Fernway** is a fictional SaaS company. Every number is generated from a fixed seed, so the dashboard always looks the same and always ends on today's date.

**Live demo:** _add your Vercel link here_

## The problem

SaaS founders track revenue in Stripe, customers in a CRM and churn in a spreadsheet. Nobody can answer "how are we doing this month?" at a glance.

## The solution

One screen with the numbers that matter, and the detail one click away.

### Overview
- **4 KPI tiles** — MRR, paying customers, new signups and monthly churn, each with a sparkline and change vs the previous period (arrow + colour, so it never relies on colour alone; churn going up is shown as bad)
- **MRR by plan** — line chart with crosshair tooltip and keyboard navigation (← →)
- **Customer movement** — new signups above the line, cancellations below, with net change
- **MRR by country** and **signups by channel**
- **Latest signups** table
- **Filters in the URL** — `?range=12m&plan=pro` — so any view can be shared as a link
- **Table view** on every chart, and **CSV export** of the current view

### Customers
- Search by name, company, email or country
- Filter by plan and status (active / trial / churned), sort by name, MRR, lifetime value or signup date
- Pagination and CSV export of the filtered list
- **Customer drawer** with MRR, lifetime value, seats and an activity timeline

### Everywhere
- **Ctrl / ⌘ + K** command palette to jump to pages or any customer
- **Dark mode**, fully responsive down to phone size
- Charts built from scratch in SVG — no chart library

## How the numbers work

| Metric | Definition |
|---|---|
| MRR | Sum of monthly plan prices of paying customers on the last day |
| Paying customers | Customers past their 14-day trial who haven't cancelled |
| Monthly churn | Customers lost ÷ average paying customers, scaled to 30 days (comparable across 7-day and 12-month views) |
| ARPU | MRR ÷ paying customers |
| Lifetime value | Months paid × plan price |

The dataset (about 3,700 customers over 2.5 years) is built in the browser in ~20 ms, and the MRR total is cross-checked against a customer-by-customer count.

## Design notes

- Colour-blind-safe chart palette, validated for the first three series in light and dark mode
- Thin marks, hairline grid, one shared axis per chart (no dual axes)
- Values in tooltips lead, labels follow; legends shown whenever there are two or more series
- Respects `prefers-reduced-motion`

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Vercel

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Project structure

```
src/
├── app/                 pages (Overview, Customers)
├── components/          dashboard UI
│   └── charts/          LineChart, DivergingColumns, HBars, Sparkline
└── lib/
    ├── data.ts          seeded demo dataset
    ├── metrics.ts       KPIs and chart series for a range + plan
    ├── format.ts        money, numbers, axis ticks
    └── csv.ts           CSV export
```

## Using it for a real business

Replace `buildDataset()` in `src/lib/data.ts` with data from your billing system (for example the Stripe API). Everything else — metrics, charts, filters — works unchanged.
