import { TopBar } from "@/components/topbar";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { Scissors, AlertTriangle, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { RegenerateTlhButton, CandidateActions } from "@/components/tlh-actions";
import { findSubstitutes } from "@/lib/tlh-substitutes";

export const dynamic = "force-dynamic";

export default async function TaxPage() {
  const [open, dismissed, acted] = await Promise.all([
    prisma.tlhCandidate.findMany({
      where: { status: "open" },
      orderBy: { unrealizedLoss: "desc" },
      include: {
        substitutes: { include: { security: true } },
      },
    }),
    prisma.tlhCandidate.count({ where: { status: "dismissed" } }),
    prisma.tlhCandidate.count({ where: { status: "acted" } }),
  ]);

  const accountIds = Array.from(new Set(open.map((c) => c.accountId)));
  const accounts = accountIds.length
    ? await prisma.account.findMany({ where: { id: { in: accountIds } } })
    : [];
  const accountById = new Map(accounts.map((a) => [a.id, a]));

  const totalLoss = open.reduce((sum, c) => sum + c.unrealizedLoss, 0);
  const safeLoss = open
    .filter((c) => !c.washSaleRisk)
    .reduce((sum, c) => sum + c.unrealizedLoss, 0);

  const lastRun = open[0]?.generatedAt ?? null;

  return (
    <>
      <TopBar title="Tax-Loss Harvesting" subtitle="Identify losses worth realizing" />
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {lastRun
              ? `Generated ${lastRun.toLocaleString()}`
              : "Run an analysis to surface harvestable losses across taxable accounts."}
          </p>
          <RegenerateTlhButton />
        </div>

        <section className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <StatCard
            label="Open candidates"
            value={String(open.length)}
            hint={`${dismissed} dismissed · ${acted} acted`}
            accentClass="text-finance-invest"
          />
          <StatCard
            label="Total potential loss"
            value={formatCurrency(totalLoss)}
            accentClass="text-finance-spend"
          />
          <StatCard
            label="Wash-sale-safe loss"
            value={formatCurrency(safeLoss)}
            hint="Excludes positions with recent buys"
            accentClass="text-finance-income"
          />
        </section>

        <Card>
          <CardHeader>
            <CardTitle>How this works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              For each holding in a <strong className="text-foreground">taxable</strong> account
              with an unrealized loss above $250 (default), the engine flags the position. A
              <strong className="text-foreground"> 30-day wash-sale window</strong> (before and
              after today) is checked across all your linked accounts — IRS rules treat IRAs and
              401(k)s under your control as the same taxpayer for wash-sale purposes.
            </p>
            <p>
              Substitute swaps are heuristics for &quot;not substantially identical&quot;
              positions. <strong className="text-foreground">Same-index</strong> swaps (e.g. VOO ↔
              IVV) are flagged as higher risk because the underlying index is identical —
              consensus is mixed; talk to your accountant.
            </p>
            <p className="text-xs">
              This is a tool, not tax advice.
            </p>
          </CardContent>
        </Card>

        {open.length === 0 ? (
          <EmptyState
            icon={Scissors}
            title="No open candidates"
            description="Either there are no taxable accounts linked, no positions in loss above the threshold, or you've actioned/dismissed everything. Click 'Regenerate' to re-analyze."
          />
        ) : (
          <div className="space-y-4">
            {open.map((c) => {
              const acct = accountById.get(c.accountId);
              const subs = c.substitutes.length > 0
                ? c.substitutes.map((s) => ({
                    ticker: s.security.ticker ?? s.security.name ?? "?",
                    rationale: s.rationale ?? "",
                  }))
                : findSubstitutes(c.ticker).map((s) => ({
                    ticker: s.ticker,
                    rationale: `${s.rationale}${s.riskFlag === "same-index" ? " · same-index swap (higher risk)" : ""}`,
                  }));

              return (
                <Card key={c.id} className={c.washSaleRisk ? "border-finance-spend/40" : ""}>
                  <CardHeader className="flex-row items-start justify-between space-y-0 gap-4">
                    <div className="space-y-1.5">
                      <CardTitle className="flex items-center gap-2">
                        {c.ticker ?? "Unknown ticker"}
                        {c.washSaleRisk ? (
                          <Badge variant="danger">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            wash-sale risk
                          </Badge>
                        ) : (
                          <Badge variant="success">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            safe
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {acct?.name ?? "Unknown account"} · {c.quantity.toFixed(4)} shares
                      </CardDescription>
                    </div>
                    <CandidateActions id={c.id} />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">Cost basis</div>
                        <div className="number font-medium mt-1">
                          {formatCurrency(c.costBasis)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Market value</div>
                        <div className="number font-medium mt-1">
                          {formatCurrency(c.marketValue)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Loss</div>
                        <div className="number font-medium mt-1 text-finance-spend">
                          {formatCurrency(c.unrealizedLoss)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">% of basis</div>
                        <div className="number font-medium mt-1">
                          {c.costBasis > 0
                            ? ((c.unrealizedLoss / c.costBasis) * 100).toFixed(1) + "%"
                            : "—"}
                        </div>
                      </div>
                    </div>

                    {c.washSaleRisk && c.washSaleReason ? (
                      <div className="rounded-md border border-finance-spend/30 bg-finance-spend/5 px-3 py-2 text-xs">
                        <strong className="text-finance-spend">Why flagged:</strong>{" "}
                        {c.washSaleReason}. Selling now would likely trigger a wash sale; either
                        wait until the window closes or buy a non-substantially-identical
                        substitute below.
                      </div>
                    ) : null}

                    {subs.length > 0 ? (
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                          Substitutes
                        </div>
                        <ul className="space-y-1.5">
                          {subs.map((s, i) => (
                            <li key={i} className="text-sm flex items-start gap-3">
                              <Badge variant="info" className="font-mono">
                                {s.ticker}
                              </Badge>
                              <span className="text-muted-foreground">{s.rationale}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
