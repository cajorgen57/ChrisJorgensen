import { prisma } from "./db";

// Aggregate every holding into a single row per security with combined
// quantity, cost basis, and market value. Cross-account roll-up makes the
// "what do I actually own?" view much easier to read.
export async function getRolledHoldings() {
  const holdings = await prisma.holding.findMany({
    include: { security: true, account: true },
  });

  const map = new Map<
    string,
    {
      securityId: string;
      ticker: string | null;
      name: string | null;
      type: string | null;
      quantity: number;
      costBasis: number;
      marketValue: number;
      accounts: string[];
      taxableMarketValue: number;
      hasTaxablePosition: boolean;
    }
  >();

  for (const h of holdings) {
    const price = h.institutionPrice ?? h.security.closePrice ?? 0;
    const marketValue =
      h.institutionValue ?? (price && h.quantity ? price * h.quantity : 0);
    const key = h.securityId;
    const existing = map.get(key);
    if (existing) {
      existing.quantity += h.quantity;
      existing.costBasis += h.costBasis ?? 0;
      existing.marketValue += marketValue;
      if (!existing.accounts.includes(h.account.name)) existing.accounts.push(h.account.name);
      if (h.account.taxStatus === "taxable") {
        existing.hasTaxablePosition = true;
        existing.taxableMarketValue += marketValue;
      }
    } else {
      map.set(key, {
        securityId: key,
        ticker: h.security.ticker,
        name: h.security.name,
        type: h.security.type,
        quantity: h.quantity,
        costBasis: h.costBasis ?? 0,
        marketValue,
        accounts: [h.account.name],
        taxableMarketValue: h.account.taxStatus === "taxable" ? marketValue : 0,
        hasTaxablePosition: h.account.taxStatus === "taxable",
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.marketValue - a.marketValue);
}

export async function getInvestmentTotals() {
  const holdings = await prisma.holding.findMany({ include: { security: true } });
  let market = 0;
  let cost = 0;
  for (const h of holdings) {
    const price = h.institutionPrice ?? h.security.closePrice ?? 0;
    market += h.institutionValue ?? (price && h.quantity ? price * h.quantity : 0);
    cost += h.costBasis ?? 0;
  }
  return {
    marketValue: market,
    costBasis: cost,
    unrealizedGain: market - cost,
    unrealizedGainPct: cost > 0 ? (market - cost) / cost : 0,
  };
}

// Allocation by security type (equity / etf / fixed income / cash / other).
export async function getAllocationByType() {
  const rolled = await getRolledHoldings();
  const map = new Map<string, number>();
  let total = 0;
  for (const r of rolled) {
    const bucket = bucketize(r.type);
    map.set(bucket, (map.get(bucket) ?? 0) + r.marketValue);
    total += r.marketValue;
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value, pct: total > 0 ? value / total : 0 }))
    .sort((a, b) => b.value - a.value);
}

function bucketize(type: string | null): string {
  const t = (type ?? "").toLowerCase();
  if (t.includes("equity") || t === "stock") return "Equity";
  if (t === "etf") return "ETF";
  if (t.includes("fixed") || t.includes("bond")) return "Fixed Income";
  if (t === "mutual fund") return "Mutual Fund";
  if (t === "cash") return "Cash";
  if (t === "crypto") return "Crypto";
  return "Other";
}
