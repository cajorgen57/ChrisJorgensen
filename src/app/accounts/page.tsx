import { TopBar } from "@/components/topbar";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, AlertTriangle } from "lucide-react";
import { PlaidLinkButton } from "@/components/plaid-link-button";
import { SyncItemButton, SyncAllButton, RemoveItemButton } from "@/components/item-actions";
import { prisma } from "@/lib/db";
import { formatCurrency, cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const items = await prisma.plaidItem.findMany({
    include: { accounts: { orderBy: { name: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  const plaidConfigured = Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);

  return (
    <>
      <TopBar title="Accounts" subtitle="Banks, credit cards, and brokerages" />
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
            {items.length === 0
              ? "Link your first institution to start syncing."
              : `${items.length} ${items.length === 1 ? "institution" : "institutions"} linked`}
          </p>
          <div className="flex items-center gap-2">
            {items.length > 0 ? <SyncAllButton /> : null}
            {plaidConfigured ? <PlaidLinkButton /> : null}
          </div>
        </div>

        {!plaidConfigured ? (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" /> Plaid not configured
              </CardTitle>
              <CardDescription>
                Set <code>PLAID_CLIENT_ID</code> and <code>PLAID_SECRET</code> in your{" "}
                <code>.env</code> (see <code>.env.example</code>) and restart the dev server.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {items.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No accounts linked yet"
            description={
              plaidConfigured
                ? "Click 'Link account' above. In sandbox, use credentials user_good / pass_good with any bank."
                : "Configure Plaid first, then come back to link an institution."
            }
          />
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {item.institutionName ?? "Unknown institution"}
                      {item.status !== "active" ? (
                        <Badge variant="danger">{item.status}</Badge>
                      ) : null}
                    </CardTitle>
                    <CardDescription>
                      {item.accounts.length} {item.accounts.length === 1 ? "account" : "accounts"}
                      {item.lastSyncedAt ? (
                        <> · synced {formatDistanceToNow(item.lastSyncedAt, { addSuffix: true })}</>
                      ) : (
                        <> · never synced</>
                      )}
                      {item.errorCode ? <> · error: {item.errorCode}</> : null}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <SyncItemButton itemId={item.id} />
                    <RemoveItemButton itemId={item.id} name={item.institutionName ?? "this institution"} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-md border border-border/60">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="text-left font-medium px-4 py-2">Account</th>
                          <th className="text-left font-medium px-4 py-2">Type</th>
                          <th className="text-right font-medium px-4 py-2">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.accounts.map((acc) => {
                          const isLiability = acc.type === "credit" || acc.type === "loan";
                          return (
                            <tr key={acc.id} className="border-t border-border/40">
                              <td className="px-4 py-2.5">
                                <div className="font-medium">{acc.name}</div>
                                {acc.mask ? (
                                  <div className="text-xs text-muted-foreground">••{acc.mask}</div>
                                ) : null}
                              </td>
                              <td className="px-4 py-2.5">
                                <Badge variant="outline" className="capitalize">
                                  {acc.subtype ?? acc.type}
                                </Badge>
                              </td>
                              <td
                                className={cn(
                                  "px-4 py-2.5 text-right number font-medium",
                                  isLiability ? "text-finance-spend" : ""
                                )}
                              >
                                {acc.currentBalance !== null
                                  ? formatCurrency(acc.currentBalance, acc.isoCurrency)
                                  : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
