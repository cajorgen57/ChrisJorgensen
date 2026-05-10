import { prisma } from "./db";
import { findSubstitutes } from "./tlh-substitutes";

export interface TlhConfig {
  /** Minimum unrealized loss in USD to surface a candidate. */
  minLossUsd: number;
  /** Wash-sale window in days, applied symmetrically (-N..+N). */
  washSaleWindowDays: number;
}

export const DEFAULT_TLH_CONFIG: TlhConfig = {
  minLossUsd: 250,
  washSaleWindowDays: 30,
};

export interface RegenerateResult {
  candidates: number;
  totalLoss: number;
  withWashSaleRisk: number;
}

// Replaces all open candidates with a freshly-computed set. Candidates the
// user has marked "dismissed" or "acted" are preserved.
export async function regenerateTlhCandidates(
  config: TlhConfig = DEFAULT_TLH_CONFIG
): Promise<RegenerateResult> {
  await prisma.tlhCandidate.deleteMany({ where: { status: "open" } });

  const holdings = await prisma.holding.findMany({
    where: {
      account: { taxStatus: "taxable" },
    },
    include: { security: true, account: true },
  });

  const today = new Date();
  const washStart = new Date(today);
  washStart.setUTCDate(washStart.getUTCDate() - config.washSaleWindowDays);
  const washEnd = new Date(today);
  washEnd.setUTCDate(washEnd.getUTCDate() + config.washSaleWindowDays);

  let totalLoss = 0;
  let withWashSaleRisk = 0;
  let candidatesCreated = 0;

  for (const h of holdings) {
    const price = h.institutionPrice ?? h.security.closePrice ?? 0;
    if (!price || !h.quantity || h.costBasis == null) continue;

    const marketValue = price * h.quantity;
    const unrealizedLoss = (h.costBasis ?? 0) - marketValue;
    if (unrealizedLoss < config.minLossUsd) continue;

    // Wash-sale check: any BUY of the same security in any account inside the
    // window? IRS rules treat IRAs/401(k)s under your control as the same
    // taxpayer, so we don't filter by account.
    const recentBuy = await prisma.investmentTransaction.findFirst({
      where: {
        securityId: h.securityId,
        type: "buy",
        date: { gte: washStart, lte: washEnd },
      },
      orderBy: { date: "desc" },
      include: { account: true },
    });

    const washSaleRisk = !!recentBuy;
    let washSaleReason: string | null = null;
    if (recentBuy) {
      const dateStr = recentBuy.date.toISOString().slice(0, 10);
      washSaleReason = `Buy of ${h.security.ticker ?? h.security.name ?? "this security"} on ${dateStr} in ${recentBuy.account.name}`;
      withWashSaleRisk += 1;
    }

    const candidate = await prisma.tlhCandidate.create({
      data: {
        accountId: h.accountId,
        securityId: h.securityId,
        ticker: h.security.ticker,
        quantity: h.quantity,
        costBasis: h.costBasis,
        marketValue,
        unrealizedLoss,
        washSaleRisk,
        washSaleReason,
      },
    });
    candidatesCreated += 1;
    totalLoss += unrealizedLoss;

    // Substitute suggestions — only persist subs that exist as Securities
    // (i.e. we have pricing/cost data on them) OR mention them by ticker.
    // For the MVP we always persist the suggestion; the UI can show the
    // ticker even if the security row doesn't exist locally.
    const subs = findSubstitutes(h.security.ticker);
    for (const sub of subs) {
      const existingSec = await prisma.security.findFirst({
        where: { ticker: sub.ticker },
        select: { id: true },
      });
      if (existingSec) {
        await prisma.tlhSubstitute.create({
          data: {
            candidateId: candidate.id,
            securityId: existingSec.id,
            rationale: `${sub.rationale}${sub.riskFlag === "same-index" ? " · same-index swap (higher risk)" : ""}`,
          },
        });
      }
    }
  }

  return {
    candidates: candidatesCreated,
    totalLoss,
    withWashSaleRisk,
  };
}

export async function updateTlhCandidate(id: string, status: "open" | "dismissed" | "acted") {
  await prisma.tlhCandidate.update({ where: { id }, data: { status } });
}
