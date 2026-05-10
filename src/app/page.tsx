import { TopBar } from "@/components/topbar";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Wallet, LineChart, Apple, Activity, Receipt } from "lucide-react";
import { getNetWorth, getSpending, getRecentTransactions } from "@/lib/finance-queries";
import { prisma } from "@/lib/db";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [netWorth, spending, recent, itemCount] = await Promise.all([
    getNetWorth(),
    getSpending(30),
    getRecentTransactions(8),
    prisma.plaidItem.count(),
  ]);

  const hasFinance = itemCount > 0;

  return (
    <>
      <TopBar title="Dashboard" subtitle="Today at a glance" />

      <div className="px-6 lg:px-10 py-8 space-y-8 max-w-[1400px]">
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Net worth"
            value={hasFinance ? formatCurrency(netWorth.netWorth) : "—"}
            hint={
              hasFinance
                ? `${formatCurrency(netWorth.assets)} assets · ${formatCurrency(netWorth.liabilities)} debts`
                : "Connect accounts to begin"
            }
            accentClass="text-finance-invest"
          />
          <StatCard
            label="Spending (30d)"
            value={hasFinance ? formatCurrency(spending.outflow) : "—"}
            hint={hasFinance ? `${formatCurrency(spending.inflow)} inflow` : "No transactions yet"}
            accentClass="text-finance-spend"
          />
          <StatCard
            label="Calories (avg 7d)"
            value="—"
            hint="Import Cronometer CSV"
            accentClass="text-fitness"
          />
          <StatCard
            label="Body fat %"
            value="—"
            hint="Add a DEXA scan"
            accentClass="text-fitness-accent"
          />
        </section>

        <section className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" /> Recent transactions
                </CardTitle>
                <CardDescription>Latest activity across all linked accounts</CardDescription>
              </div>
              {hasFinance ? (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/transactions">View all</Link>
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="p-0">
              {recent.length === 0 ? (
                <div className="px-6 pb-6">
                  <EmptyState
                    title="No transactions yet"
                    description="Link an institution from the Accounts page to start syncing."
                    action={
                      <Button asChild>
                        <Link href="/accounts">Go to accounts</Link>
                      </Button>
                    }
                  />
                </div>
              ) : (
                <ul className="divide-y divide-border/50">
                  {recent.map((t) => {
                    const cents = Number(t.amountCents);
                    const isOutflow = cents > 0;
                    return (
                      <li key={t.id} className="px-6 py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{t.merchantName ?? t.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{format(t.date, "MMM d")}</span>
                            <span>·</span>
                            <span className="truncate">{t.account.name}</span>
                            {t.pfcPrimary ? (
                              <Badge variant="outline" className="capitalize">
                                {t.pfcPrimary.replace(/_/g, " ").toLowerCase()}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <div
                          className={cn(
                            "number font-medium whitespace-nowrap",
                            isOutflow ? "text-finance-spend" : "text-finance-income"
                          )}
                        >
                          {isOutflow ? "" : "+"}
                          {formatCurrency(-cents / 100, t.isoCurrency)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" /> Finance
                </CardTitle>
                <CardDescription>
                  Plaid for accounts, transactions, and investments.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button asChild>
                  <Link href="/accounts">
                    {hasFinance ? "Manage accounts" : "Link an account"}
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/investments">
                    <LineChart className="h-4 w-4" /> Investments
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Wellness
                </CardTitle>
                <CardDescription>
                  Cronometer nutrition and DEXA tracking — coming in phases 4 and 5.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button asChild>
                  <Link href="/nutrition">
                    <Apple className="h-4 w-4" /> Nutrition
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/body">
                    <Activity className="h-4 w-4" /> Body & DEXA
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}
