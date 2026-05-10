import { TopBar } from "@/components/topbar";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { LineChart } from "lucide-react";
import { AllocationChart } from "@/components/allocation-chart";
import {
  getRolledHoldings,
  getInvestmentTotals,
  getAllocationByType,
} from "@/lib/investment-queries";
import { formatCurrency, cn, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InvestmentsPage() {
  const [holdings, totals, allocation] = await Promise.all([
    getRolledHoldings(),
    getInvestmentTotals(),
    getAllocationByType(),
  ]);

  if (holdings.length === 0) {
    return (
      <>
        <TopBar title="Investments" subtitle="Holdings, performance, allocation" />
        <div className="px-6 lg:px-10 py-8 max-w-[1400px]">
          <EmptyState
            icon={LineChart}
            title="No investment data yet"
            description="Link a brokerage on the Accounts page. Plaid Investments pulls holdings, cost basis, and buy/sell/dividend history."
          />
        </div>
      </>
    );
  }

  const gainPositive = totals.unrealizedGain >= 0;

  return (
    <>
      <TopBar title="Investments" subtitle="Holdings, performance, allocation" />
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] space-y-6">
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Market value"
            value={formatCurrency(totals.marketValue)}
            accentClass="text-finance-invest"
          />
          <StatCard
            label="Cost basis"
            value={formatCurrency(totals.costBasis)}
            accentClass="text-muted-foreground"
          />
          <StatCard
            label="Unrealized P/L"
            value={formatCurrency(totals.unrealizedGain)}
            trend={{
              value: formatPercent(totals.unrealizedGainPct, 2),
              positive: gainPositive,
            }}
            accentClass={gainPositive ? "text-finance-income" : "text-finance-spend"}
          />
          <StatCard
            label="Positions"
            value={String(holdings.length)}
            hint={`across ${new Set(holdings.flatMap((h) => h.accounts)).size} accounts`}
            accentClass="text-fitness-accent"
          />
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Allocation</CardTitle>
            <CardDescription>By security type</CardDescription>
          </CardHeader>
          <CardContent>
            <AllocationChart data={allocation} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
            <CardDescription>Rolled up across all accounts</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-4 py-2.5">Security</th>
                    <th className="text-left font-medium px-4 py-2.5">Type</th>
                    <th className="text-right font-medium px-4 py-2.5">Qty</th>
                    <th className="text-right font-medium px-4 py-2.5">Cost basis</th>
                    <th className="text-right font-medium px-4 py-2.5">Market value</th>
                    <th className="text-right font-medium px-4 py-2.5">P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => {
                    const pl = h.marketValue - h.costBasis;
                    const plPct = h.costBasis > 0 ? pl / h.costBasis : 0;
                    return (
                      <tr key={h.securityId} className="border-t border-border/40">
                        <td className="px-4 py-2.5">
                          <div className="font-medium">
                            {h.ticker ?? h.name ?? "—"}
                            {h.hasTaxablePosition ? null : (
                              <Badge variant="secondary" className="ml-2 text-[10px]">
                                tax-advantaged
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[260px]">
                            {h.name}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className="capitalize">
                            {h.type ?? "other"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right number">{h.quantity.toFixed(4)}</td>
                        <td className="px-4 py-2.5 text-right number text-muted-foreground">
                          {formatCurrency(h.costBasis)}
                        </td>
                        <td className="px-4 py-2.5 text-right number font-medium">
                          {formatCurrency(h.marketValue)}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-2.5 text-right number font-medium",
                            pl >= 0 ? "text-finance-income" : "text-finance-spend"
                          )}
                        >
                          {pl >= 0 ? "+" : ""}
                          {formatCurrency(pl)}
                          <div className="text-[10px] font-normal opacity-80">
                            {formatPercent(plPct, 1)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
