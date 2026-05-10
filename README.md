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

This is being built in phases. **Phase 1 (foundation) is complete**; the rest
is wired up as empty pages with clear next steps.

- [x] **Phase 1 — Foundation**
  - Project scaffold, design system, sidebar/dashboard shell
  - Full Prisma schema for finance + fitness
  - Plaid client + at-rest encryption helpers (no flow yet)
  - Empty pages for every section
- [ ] **Phase 2 — Plaid Link & transactions**
  - `/api/plaid/link-token`, `/api/plaid/exchange-token`
  - `/api/plaid/sync` using `/transactions/sync` cursor
  - Categorization view + user-override category
- [ ] **Phase 3 — Investments & TLH**
  - Holdings + cost basis pull from Plaid Investments
  - Wash-sale-aware TLH candidate engine + substitute suggestions
- [ ] **Phase 4 — Cronometer nutrition**
  - CSV upload, parse, dedupe, daily/rolling charts
- [ ] **Phase 5 — DEXA & body composition**
  - Manual entry forms, PDF upload (stored under `/uploads`), trend charts

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
    ui/                  Card, Button (shadcn-style primitives)
    sidebar.tsx          Left nav
    topbar.tsx           Page header w/ theme toggle
    stat-card.tsx        Big-number cards
    empty-state.tsx      Friendly "no data yet" card
    theme-provider.tsx   next-themes wrapper
  lib/
    db.ts                Prisma client singleton
    plaid.ts             Plaid SDK client, products, country codes
    crypto.ts            AES-256-GCM encrypt/decrypt for tokens
    utils.ts             cn(), money/number formatters
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
