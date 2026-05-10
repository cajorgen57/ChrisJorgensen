import { plaid, plaidProducts, plaidCountryCodes } from "./plaid";
import { encrypt, decrypt } from "./crypto";
import { prisma } from "./db";
import type {
  AccountBase,
  Transaction as PlaidTransaction,
  RemovedTransaction,
} from "plaid";

// One canonical user for this single-user local app.
const CLIENT_USER_ID = "personal-tracker";

export async function createLinkToken(): Promise<string> {
  const r = await plaid().linkTokenCreate({
    user: { client_user_id: CLIENT_USER_ID },
    client_name: process.env.PLAID_CLIENT_NAME ?? "Personal Tracker",
    products: plaidProducts(),
    country_codes: plaidCountryCodes(),
    language: "en",
    webhook: process.env.PLAID_WEBHOOK_URL || undefined,
  });
  return r.data.link_token;
}

// Exchange a public token from Plaid Link for a long-lived access token,
// persist it (encrypted), then run a first sync. Returns the new item's row id.
export async function exchangeAndInit(publicToken: string): Promise<string> {
  const exch = await plaid().itemPublicTokenExchange({ public_token: publicToken });
  const accessToken = exch.data.access_token;
  const itemId = exch.data.item_id;

  let institutionId: string | null = null;
  let institutionName: string | null = null;
  try {
    const itemResp = await plaid().itemGet({ access_token: accessToken });
    institutionId = itemResp.data.item.institution_id ?? null;
    if (institutionId) {
      const inst = await plaid().institutionsGetById({
        institution_id: institutionId,
        country_codes: plaidCountryCodes(),
      });
      institutionName = inst.data.institution.name;
    }
  } catch {
    // Institution lookup is best-effort.
  }

  const item = await prisma.plaidItem.create({
    data: {
      itemId,
      institutionId,
      institutionName,
      accessTokenCipher: encrypt(accessToken),
      status: "active",
    },
  });

  await syncItem(item.id);
  return item.id;
}

// Pull current accounts/balances + run /transactions/sync from the saved
// cursor. Idempotent and incremental thanks to Plaid's cursor pagination.
export async function syncItem(itemRowId: string) {
  const item = await prisma.plaidItem.findUnique({ where: { id: itemRowId } });
  if (!item) throw new Error("Item not found");
  const accessToken = decrypt(item.accessTokenCipher);

  // ----- Accounts (always refresh balances) -----
  const accResp = await plaid().accountsGet({ access_token: accessToken });
  for (const a of accResp.data.accounts) {
    await upsertAccount(a, item.id);
  }

  const accountIdMap = new Map<string, string>();
  const accountRows = await prisma.account.findMany({
    where: { itemId: item.id },
    select: { id: true, plaidAccountId: true },
  });
  for (const a of accountRows) accountIdMap.set(a.plaidAccountId, a.id);

  // ----- Transactions (incremental sync) -----
  let cursor: string | undefined = item.cursor ?? undefined;
  const added: PlaidTransaction[] = [];
  const modified: PlaidTransaction[] = [];
  const removed: RemovedTransaction[] = [];
  let hasMore = true;
  let pages = 0;

  while (hasMore) {
    const resp = await plaid().transactionsSync({
      access_token: accessToken,
      cursor,
      count: 500,
    });
    added.push(...resp.data.added);
    modified.push(...resp.data.modified);
    removed.push(...resp.data.removed);
    hasMore = resp.data.has_more;
    cursor = resp.data.next_cursor;
    pages += 1;
    if (pages > 50) break; // safety belt
  }

  for (const t of added) {
    const accId = accountIdMap.get(t.account_id);
    if (!accId) continue;
    await prisma.transaction.upsert({
      where: { plaidTxId: t.transaction_id },
      create: txCreateData(t, accId),
      update: txUpdateData(t),
    });
  }
  for (const t of modified) {
    const accId = accountIdMap.get(t.account_id);
    if (!accId) continue;
    await prisma.transaction.upsert({
      where: { plaidTxId: t.transaction_id },
      create: txCreateData(t, accId),
      update: txUpdateData(t),
    });
  }
  for (const r of removed) {
    if (r.transaction_id) {
      await prisma.transaction.deleteMany({ where: { plaidTxId: r.transaction_id } });
    }
  }

  await prisma.plaidItem.update({
    where: { id: item.id },
    data: { cursor, lastSyncedAt: new Date(), status: "active", errorCode: null },
  });

  return { added: added.length, modified: modified.length, removed: removed.length };
}

export async function syncAllItems() {
  const items = await prisma.plaidItem.findMany({ where: { status: "active" } });
  const results: Array<{ itemId: string; added: number; modified: number; removed: number; error?: string }> = [];
  for (const item of items) {
    try {
      const r = await syncItem(item.id);
      results.push({ itemId: item.id, ...r });
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { error_code?: string } } })?.response?.data?.error_code;
      await prisma.plaidItem.update({
        where: { id: item.id },
        data: { status: "error", errorCode: code ?? "UNKNOWN" },
      });
      results.push({
        itemId: item.id,
        added: 0,
        modified: 0,
        removed: 0,
        error: code ?? (err instanceof Error ? err.message : "Unknown error"),
      });
    }
  }
  return results;
}

export async function removeItem(itemRowId: string) {
  const item = await prisma.plaidItem.findUnique({ where: { id: itemRowId } });
  if (!item) return;
  try {
    const accessToken = decrypt(item.accessTokenCipher);
    await plaid().itemRemove({ access_token: accessToken });
  } catch {
    // even if Plaid removal fails, drop our local copy.
  }
  await prisma.plaidItem.delete({ where: { id: itemRowId } });
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function upsertAccount(a: AccountBase, itemId: string) {
  const data = {
    name: a.name,
    officialName: a.official_name ?? null,
    mask: a.mask ?? null,
    type: a.type,
    subtype: a.subtype ?? null,
    currentBalance: a.balances.current ?? null,
    availableBalance: a.balances.available ?? null,
    isoCurrency: a.balances.iso_currency_code ?? "USD",
  };
  await prisma.account.upsert({
    where: { plaidAccountId: a.account_id },
    create: { plaidAccountId: a.account_id, itemId, ...data },
    update: data,
  });
}

function toCents(amount: number | null | undefined): bigint {
  if (amount === null || amount === undefined) return 0n;
  return BigInt(Math.round(Number(amount) * 100));
}

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  // Plaid returns YYYY-MM-DD. Anchor at UTC midnight.
  return new Date(`${s}T00:00:00.000Z`);
}

function txCreateData(t: PlaidTransaction, accountId: string) {
  const date = parseDate(t.date);
  if (!date) throw new Error(`Transaction ${t.transaction_id} has no date`);
  return {
    plaidTxId: t.transaction_id,
    accountId,
    date,
    authorizedDate: parseDate(t.authorized_date),
    amountCents: toCents(t.amount),
    isoCurrency: t.iso_currency_code ?? "USD",
    name: t.name,
    merchantName: t.merchant_name ?? null,
    pending: t.pending,
    pfcPrimary: t.personal_finance_category?.primary ?? null,
    pfcDetailed: t.personal_finance_category?.detailed ?? null,
    category: t.category?.[0] ?? null,
  };
}

function txUpdateData(t: PlaidTransaction) {
  const date = parseDate(t.date);
  return {
    ...(date ? { date } : {}),
    authorizedDate: parseDate(t.authorized_date),
    amountCents: toCents(t.amount),
    isoCurrency: t.iso_currency_code ?? "USD",
    name: t.name,
    merchantName: t.merchant_name ?? null,
    pending: t.pending,
    pfcPrimary: t.personal_finance_category?.primary ?? null,
    pfcDetailed: t.personal_finance_category?.detailed ?? null,
    category: t.category?.[0] ?? null,
  };
}
