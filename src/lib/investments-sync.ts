import { plaid } from "./plaid";
import { prisma } from "./db";
import type { Holding as PlaidHolding, Security as PlaidSecurity, InvestmentTransaction as PlaidInvestmentTransaction } from "plaid";

const INVESTMENT_TX_LOOKBACK_DAYS = 365 * 2; // 2 years of investment txs by default

// Sync holdings + investment transactions for one item. Caller is expected to
// have already decrypted the access token. Returns counts; throws on hard
// errors (the caller wraps in try/catch and may flag the item as skipping
// investments — e.g. no investments product on this item).
export async function syncInvestmentsForItem(itemRowId: string, accessToken: string) {
  // Holdings = accounts + securities + holdings rows. Plaid returns all three
  // in one response so we upsert in dependency order: securities → holdings.
  const holdingsResp = await plaid().investmentsHoldingsGet({ access_token: accessToken });

  const securityIdMap = new Map<string, string>(); // plaidSecurityId -> our id
  for (const sec of holdingsResp.data.securities) {
    const id = await upsertSecurity(sec);
    securityIdMap.set(sec.security_id, id);
  }

  // Map plaid account -> our account id (those should already exist from
  // the prior accountsGet call in syncItem).
  const accountIdMap = new Map<string, string>();
  const accountRows = await prisma.account.findMany({
    where: { item: { id: itemRowId } },
    select: { id: true, plaidAccountId: true },
  });
  for (const a of accountRows) accountIdMap.set(a.plaidAccountId, a.id);

  let holdingsCount = 0;
  for (const h of holdingsResp.data.holdings) {
    const accountId = accountIdMap.get(h.account_id);
    const securityId = securityIdMap.get(h.security_id);
    if (!accountId || !securityId) continue;
    await upsertHolding(h, accountId, securityId);
    holdingsCount += 1;
  }

  // Wipe holdings that Plaid no longer reports (the user sold the position
  // entirely). Compute the set of (account, security) pairs we just upserted
  // and delete the rest belonging to this item's accounts.
  const seenPairs = new Set(
    holdingsResp.data.holdings
      .map((h) => {
        const a = accountIdMap.get(h.account_id);
        const s = securityIdMap.get(h.security_id);
        return a && s ? `${a}::${s}` : null;
      })
      .filter(Boolean) as string[]
  );
  const existing = await prisma.holding.findMany({
    where: { account: { itemId: itemRowId } },
    select: { id: true, accountId: true, securityId: true },
  });
  const stale = existing.filter((e) => !seenPairs.has(`${e.accountId}::${e.securityId}`));
  if (stale.length > 0) {
    await prisma.holding.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
  }

  // ----- Investment transactions -----
  const today = new Date();
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - INVESTMENT_TX_LOOKBACK_DAYS);

  let offset = 0;
  let txCount = 0;
  // Keep running until we've seen total_investment_transactions or hit a
  // safety bound. Page size 500 is the Plaid maximum.
  for (let i = 0; i < 50; i++) {
    const txResp = await plaid().investmentsTransactionsGet({
      access_token: accessToken,
      start_date: ymd(start),
      end_date: ymd(today),
      options: { count: 500, offset },
    });

    // Securities returned in the tx response may be richer; upsert any new ones.
    for (const sec of txResp.data.securities) {
      if (!securityIdMap.has(sec.security_id)) {
        const id = await upsertSecurity(sec);
        securityIdMap.set(sec.security_id, id);
      }
    }

    for (const tx of txResp.data.investment_transactions) {
      const accountId = accountIdMap.get(tx.account_id);
      if (!accountId) continue;
      const securityId = tx.security_id ? securityIdMap.get(tx.security_id) ?? null : null;
      await upsertInvestmentTx(tx, accountId, securityId);
      txCount += 1;
    }

    offset += txResp.data.investment_transactions.length;
    if (offset >= txResp.data.total_investment_transactions) break;
    if (txResp.data.investment_transactions.length === 0) break;
  }

  return { holdings: holdingsCount, transactions: txCount };
}

async function upsertSecurity(sec: PlaidSecurity): Promise<string> {
  const data = {
    ticker: sec.ticker_symbol ?? null,
    cusip: sec.cusip ?? null,
    isin: sec.isin ?? null,
    name: sec.name ?? null,
    type: sec.type ?? null,
    isoCurrency: sec.iso_currency_code ?? "USD",
    closePrice: sec.close_price ?? null,
    closePriceAsOf: sec.close_price_as_of ? new Date(`${sec.close_price_as_of}T00:00:00.000Z`) : null,
  };
  const r = await prisma.security.upsert({
    where: { plaidSecurityId: sec.security_id },
    create: { plaidSecurityId: sec.security_id, ...data },
    update: data,
    select: { id: true },
  });
  return r.id;
}

async function upsertHolding(h: PlaidHolding, accountId: string, securityId: string) {
  const data = {
    quantity: h.quantity,
    costBasis: h.cost_basis ?? null,
    institutionPrice: h.institution_price ?? null,
    institutionPriceAsOf: h.institution_price_as_of
      ? new Date(`${h.institution_price_as_of}T00:00:00.000Z`)
      : null,
    institutionValue: h.institution_value ?? null,
    isoCurrency: h.iso_currency_code ?? "USD",
  };
  await prisma.holding.upsert({
    where: { accountId_securityId: { accountId, securityId } },
    create: { accountId, securityId, ...data },
    update: data,
  });
}

async function upsertInvestmentTx(
  tx: PlaidInvestmentTransaction,
  accountId: string,
  securityId: string | null
) {
  const date = new Date(`${tx.date}T00:00:00.000Z`);
  const data = {
    accountId,
    securityId,
    date,
    type: tx.type,
    subtype: tx.subtype ?? null,
    quantity: tx.quantity ?? null,
    price: tx.price ?? null,
    fees: tx.fees ?? null,
    amount: tx.amount,
    isoCurrency: tx.iso_currency_code ?? "USD",
    name: tx.name ?? null,
  };
  await prisma.investmentTransaction.upsert({
    where: { plaidInvestmentTxId: tx.investment_transaction_id },
    create: { plaidInvestmentTxId: tx.investment_transaction_id, ...data },
    update: data,
  });
}

function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
