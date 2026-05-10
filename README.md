# Personal Tracker

Private, local-first finance + fitness tracker for Chris.

- **Finance:** Plaid-powered account linking, transaction sync, investment
  holdings, and a tax-loss-harvesting suggester (with wash-sale guard).
- **Wellness:** Cronometer nutrition CSV import, DEXA scan + body composition
  tracking, daily metrics (weight, sleep, HRV, RHR, steps).

Built with **Next.js 15 (App Router) + TypeScript + Tailwind + shadcn-style UI
+ Prisma + SQLite**. Runs entirely on your machine — no cloud services hold
your financial or health data.

> **Make this repo private before adding any real keys or data.** GitHub →
> repo Settings → Danger Zone → Change visibility → Private.

---

## Roadmap

All five phases are landed. Future work would be charting/categorization
refinements, account-level tax-status overrides, and webhook-driven Plaid
sync.

- [x] **Phase 1 — Foundation:** scaffold, design system, full Prisma schema,
  Plaid client + at-rest encryption helpers
- [x] **Phase 2 — Plaid Link & transactions:** Link flow, `/transactions/sync`
  with cursor, real Accounts and Transactions pages
- [x] **Phase 3 — Investments & TLH:** holdings + cost basis,
  wash-sale-aware TLH engine with curated ETF substitute map
- [x] **Phase 4 — Cronometer nutrition:** CSV import (tolerant header
  matching, dedup), daily/rolling charts
- [x] **Phase 5 — DEXA & body composition:** manual entry forms for daily
  metrics and DEXA scans, optional PDF upload, trend charts

---

## Setup

### Prerequisites

- Node.js 22+
- A Plaid developer account: <https://dashboard.plaid.com/>

### First-run

```bash
# 1. Install dependencies
npm install

# 2. Generate the Prisma client and create the SQLite DB
npm run db:push

# 3. Copy env template and fill in values
cp .env.example .env
#   - PLAID_CLIENT_ID, PLAID_SECRET — from your Plaid dashboard
#   - PLAID_ENV — start with "sandbox", switch to "development" for real accounts
#   - APP_SECRET — generate with:
#       node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 4. Start the dev server
npm run dev
# open http://localhost:3000
```

### Useful scripts

| Script              | What it does                                |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Start Next.js dev server on :3000           |
| `npm run build`     | Production build                            |
| `npm run typecheck` | `tsc --noEmit`                              |
| `npm run db:push`   | Apply `prisma/schema.prisma` to SQLite      |
| `npm run db:studio` | Open Prisma Studio to browse the DB         |
| `npm run db:reset`  | **Destructive** — wipe & re-create the DB   |

---

## Security model

This app is designed to run on **your machine only**. Even so:

- Plaid access tokens are encrypted at rest with AES-256-GCM using a key
  derived from `APP_SECRET` (see `src/lib/crypto.ts`). The SQLite file alone
  cannot be used to access your accounts without that secret.
- `.env`, `prisma/*.db`, and anything under `uploads/` / `data/` /
  `storage/` are gitignored. Do not commit them.
- Plaid in `sandbox` mode uses fake data — safe for development. Switch to
  `development` (free for ≤100 items) only when you want real accounts.
- Health data (Cronometer exports, DEXA reports) lives in `uploads/` outside
  git history.

If you ever push this repo somewhere shared, double-check `git status` and
the `.gitignore` first.

---

## Repository layout

```
src/
  app/
    layout.tsx           Global layout (sidebar + theme provider)
    page.tsx             Dashboard
    accounts/            Linked accounts
    transactions/        Transaction list / spending
    investments/         Holdings, allocation, performance
    tax/                 Tax-loss harvesting suggestions
    nutrition/           Cronometer imports + macro charts
    body/                DEXA scans + daily body metrics
    settings/            Environment + integration health
  components/
    ui/                  shadcn-style primitives (Card, Button, Input,
                         Label, Badge, Skeleton, Tabs)
    sidebar.tsx          Left nav
    topbar.tsx           Page header w/ theme toggle
    stat-card.tsx        Big-number cards
    empty-state.tsx      Friendly "no data yet" card
    theme-provider.tsx   next-themes wrapper
    plaid-link-button.tsx, item-actions.tsx — Plaid linking + sync controls
    allocation-chart.tsx — investments pie
    tlh-actions.tsx      — TLH regenerate + per-candidate Acted/Dismiss
    nutrition-upload.tsx, nutrition-charts.tsx — Cronometer import + charts
    body-metric-form.tsx, dexa-form.tsx, body-charts.tsx — manual entry
                         forms + DEXA/weight trend charts
  lib/
    db.ts                Prisma client singleton
    plaid.ts             Plaid SDK client, products, country codes
    crypto.ts            AES-256-GCM encrypt/decrypt for tokens
    utils.ts             cn(), money/number formatters
    plaid-sync.ts        Link / exchange / sync / remove for Plaid items
    investments-sync.ts  Holdings + investment txs from Plaid
    tax-status.ts        Infer taxable / tax-advantaged from Plaid subtype
    tlh-engine.ts        Wash-sale-aware TLH candidate generator
    tlh-substitutes.ts   Curated ETF swap map
    finance-queries.ts   Net worth, spending, recent txs
    investment-queries.ts Rolled holdings, allocation
    nutrition-import.ts  Cronometer Servings CSV parser + dedup importer
    nutrition-queries.ts Daily totals + rolling averages
prisma/
  schema.prisma          Full data model — see comments in file
archive/                 Old contents of this repo (game AI, pandas lessons),
                         kept for reference only.
```

---

## Disclaimers

- The TLH engine suggests ideas; it is **not tax advice**. Verify with your
  accountant before acting.
- DEXA / nutrition data here is for personal tracking, not medical guidance.
