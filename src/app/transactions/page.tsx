import { TopBar } from "@/components/topbar";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Prisma } from "@prisma/client";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  account?: string;
  category?: string;
  days?: string;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const days = Math.min(365, Math.max(1, Number(sp.days ?? 90)));

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - days);

  const where: Prisma.TransactionWhereInput = {
    date: { gte: since },
    ...(sp.q ? { OR: [
      { name: { contains: sp.q } },
      { merchantName: { contains: sp.q } },
    ] } : {}),
    ...(sp.account ? { accountId: sp.account } : {}),
    ...(sp.category ? { pfcPrimary: sp.category } : {}),
  };

  const [txs, accounts, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { account: true },
      take: 500,
    }),
    prisma.account.findMany({ orderBy: { name: "asc" }, include: { item: true } }),
    prisma.transaction.count({ where }),
  ]);

  return (
    <>
      <TopBar title="Transactions" subtitle="All accounts" />
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] space-y-6">
        <Card>
          <CardContent className="p-4">
            <form className="flex flex-wrap items-end gap-3" action="/transactions">
              <div className="flex flex-col gap-1.5 min-w-[220px] flex-1">
                <label className="text-xs text-muted-foreground">Search</label>
                <Input name="q" defaultValue={sp.q ?? ""} placeholder="Merchant or transaction…" />
              </div>
              <div className="flex flex-col gap-1.5 min-w-[180px]">
                <label className="text-xs text-muted-foreground">Account</label>
                <select
                  name="account"
                  defaultValue={sp.account ?? ""}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">All accounts</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.item.institutionName ? `${a.item.institutionName} · ` : ""}
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 w-[120px]">
                <label className="text-xs text-muted-foreground">Days back</label>
                <Input name="days" type="number" min={1} max={365} defaultValue={String(days)} />
              </div>
              <button
                type="submit"
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
              >
                Apply
              </button>
            </form>
          </CardContent>
        </Card>

        {accounts.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Link an account to see transactions"
            description="Once Plaid is connected, transactions sync incrementally with the /transactions/sync cursor."
          />
        ) : txs.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No transactions match"
            description="Try widening the date range or clearing filters."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium px-4 py-2.5 whitespace-nowrap">Date</th>
                      <th className="text-left font-medium px-4 py-2.5">Description</th>
                      <th className="text-left font-medium px-4 py-2.5">Account</th>
                      <th className="text-left font-medium px-4 py-2.5">Category</th>
                      <th className="text-right font-medium px-4 py-2.5 whitespace-nowrap">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txs.map((t) => {
                      const cents = Number(t.amountCents);
                      const isOutflow = cents > 0;
                      return (
                        <tr key={t.id} className="border-t border-border/40 hover:bg-muted/20">
                          <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground number">
                            {format(t.date, "MMM d")}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="font-medium">{t.merchantName ?? t.name}</div>
                            {t.pending ? (
                              <Badge variant="outline" className="mt-1">
                                pending
                              </Badge>
                            ) : null}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                            {t.account.name}
                            {t.account.mask ? ` ··${t.account.mask}` : ""}
                          </td>
                          <td className="px-4 py-2.5">
                            {t.pfcPrimary ? (
                              <Badge variant="secondary" className="capitalize">
                                {t.pfcPrimary.replace(/_/g, " ").toLowerCase()}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td
                            className={cn(
                              "px-4 py-2.5 text-right whitespace-nowrap number font-medium",
                              isOutflow ? "text-finance-spend" : "text-finance-income"
                            )}
                          >
                            {isOutflow ? "" : "+"}
                            {formatCurrency(-cents / 100, t.isoCurrency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 text-xs text-muted-foreground border-t border-border/40">
                Showing {txs.length} of {total}
                {total > txs.length ? " (capped at 500)" : ""}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
