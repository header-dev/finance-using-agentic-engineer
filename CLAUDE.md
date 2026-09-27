# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

WealthSync — a single-user personal finance + stock portfolio tracker. Next.js 16 App Router, React 19, TypeScript, Tailwind 4, shadcn/ui, Prisma 6 + SQLite, Recharts 3, yahoo-finance2 v4 for live quotes (no API key).

## Commands

```bash
npm run dev              # dev server on http://localhost:3000
npm run build            # production build (also type-checks)
npm run start            # serve the production build
npm run lint             # eslint
npx tsc --noEmit         # type-check only
npx prisma db push       # apply prisma/schema.prisma to prisma/dev.db (+ regenerates client)
npx prisma studio        # browse the database
npx tsx <file>.ts        # run a one-off TS script against src/lib (e.g. to exercise actions or stock-api)
```

There is no test suite. Stop `npm run dev` before `npm run build` — both write to `.next/`.

Reset the database: `rm prisma/dev.db && npx prisma db push` (it holds real user data — back it up first).

## Version constraints

- **Prisma is pinned to v6** on purpose: Prisma 7 needs Node ≥ 20.19 and drops `url` from `schema.prisma` in favor of `prisma.config.ts` + a driver adapter. The DB URL (`file:./dev.db`) lives in the schema; there is no `.env`.
- The machine runs Node 20.14. yahoo-finance2 v4 logs "Requires Node >= 22" on every server start/build; it works, but that warning is expected, not a new bug.
- yahoo-finance2 v4 must be instantiated: `new YahooFinance({ suppressNotices: ["yahooSurvey"] })` — the old default-export singleton API is gone.
- shadcn components are the **Base UI** flavor (`@base-ui/react`, style `base-nova`), not Radix: no `asChild` (use `render`), and `Select`/`Tabs` use `value` + `onValueChange(value, eventDetails)`. `Select` value may be `null`.

## Architecture

Data flow is RSC reads + Server Action writes; there are no API routes and no client-side data fetching.

- **Pages** (`src/app/{page,transactions/page,portfolio/page}.tsx`) are async Server Components with `export const dynamic = "force-dynamic"`. They query Prisma directly and pass plain data to components. The dashboard (`/`) aggregates with `prisma.transaction.groupBy` and prices holdings via `getPortfolioWithPrices`.
- **Mutations** all live in `src/lib/actions.ts` (`"use server"`). Each validates input with zod, returns `ActionResult` (`{ ok: true } | { ok: false, error }`) instead of throwing, and calls `revalidatePath("/")` plus the page it affects. Any new mutation must revalidate `/` too, since the dashboard aggregates everything.
  - `addOrUpdateStock` looks up a live quote first and rejects tickers Yahoo can't price, then upserts with `shares: { increment }` (re-adding a ticker adds shares).
- **Stock prices** (`src/lib/stock-api.ts`): `getQuotePrice` never throws — it returns `null` on failure. `getPortfolioWithPrices` maps that to `{ currentPrice: null, totalValue: 0, error: true }`, so one bad ticker degrades a row ("Unavailable") instead of breaking the page; totals exclude unpriced holdings.
- **Client components** are only the interactive leaves: forms (`src/components/forms/`), `nav.tsx`, `delete-button.tsx`, and `charts/donut-chart.tsx`. Forms call actions inside `useTransition` and report via `sonner` toasts. Tables are server components that pass a bound action to the shared `DeleteButton` (`deleteStock.bind(null, id)`).
- `transaction.type` is a plain string column constrained to `"INCOME" | "EXPENSE"` by zod; the category lists per type are in `src/lib/constants.ts`.
- Transaction dates are submitted as `YYYY-MM-DDT12:00:00` (local noon) so the calendar day survives timezone conversion.

## Charts

Both pie charts (`expense-pie-chart.tsx`, `portfolio-allocation-chart.tsx`) are thin wrappers over `charts/donut-chart.tsx`, which:
- uses the categorical palette `--series-1..6` defined for light and `.dark` in `src/app/globals.css` (validated for colorblind separation — keep the fixed order, don't add or cycle hues);
- sorts slices by value and folds anything beyond 5 into "Other" (≤ 6 slices);
- always renders an HTML legend with value and % — this is required because three of the palette colors are < 3:1 contrast on white.

## Conventions

- Money formatting: `formatCurrency` in `src/lib/utils.ts` (USD). Numeric cells use `tabular-nums`.
- Prisma client: import the singleton `prisma` from `@/lib/prisma`, never `new PrismaClient()`.
- The root layout's Geist font variable must stay `--font-sans` — shadcn's `globals.css` reads that name.
