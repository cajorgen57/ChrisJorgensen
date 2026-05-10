import { prisma } from "./db";

// Net worth: depository + investment balances are positive contributors,
// credit + loan balances reduce it. We use Plaid's `current` balance directly.
export async function getNetWorth() {
  const accounts = await prisma.account.findMany({
    select: { type: true, currentBalance: true, isoCurrency: true },
  });
  let assets = 0;
  let liabilities = 0;
  for (const a of accounts) {
    const bal = a.currentBalance ?? 0;
    if (a.type === "credit" || a.type === "loan") {
      liabilities += bal;
    } else {
      assets += bal;
    }
  }
  return { assets, liabilities, netWorth: assets - liabilities };
}

export async function getSpending(daysBack = 30) {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - daysBack);

  const txs = await prisma.transaction.findMany({
    where: {
      excluded: false,
      pending: false,
      date: { gte: since },
    },
    select: { amountCents: true, account: { select: { type: true } } },
  });
  // Spending = positive amounts on non-credit-payment txs. Plaid convention:
  // outflow > 0, inflow < 0. Internal credit-card payments are usually
  // mirrored on both sides — we exclude transfer category in queries below.
  let outflow = 0;
  let inflow = 0;
  for (const t of txs) {
    const cents = Number(t.amountCents);
    if (cents > 0) outflow += cents;
    else inflow += -cents;
  }
  return {
    outflowCents: outflow,
    inflowCents: inflow,
    netCents: outflow - inflow,
    outflow: outflow / 100,
    inflow: inflow / 100,
    net: (outflow - inflow) / 100,
  };
}

export async function getRecentTransactions(limit = 10) {
  return prisma.transaction.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: { account: true },
  });
}

export async function getSpendingByCategory(daysBack = 30) {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - daysBack);
  const grouped = await prisma.transaction.groupBy({
    by: ["pfcPrimary"],
    where: {
      excluded: false,
      pending: false,
      date: { gte: since },
      amountCents: { gt: 0 },
    },
    _sum: { amountCents: true },
    orderBy: { _sum: { amountCents: "desc" } },
  });
  return grouped.map((g) => ({
    category: g.pfcPrimary ?? "Uncategorized",
    cents: Number(g._sum.amountCents ?? 0),
    amount: Number(g._sum.amountCents ?? 0) / 100,
  }));
}
