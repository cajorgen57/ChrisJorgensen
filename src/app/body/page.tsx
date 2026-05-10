import { TopBar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { BodyMetricForm } from "@/components/body-metric-form";
import { DexaForm } from "@/components/dexa-form";
import { WeightChart, BodyCompChart } from "@/components/body-charts";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { Activity, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BodyPage() {
  const to = new Date();
  to.setUTCHours(0, 0, 0, 0);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 179); // 180 days

  const [metrics, dexaScans, latestMetric, latestDexa] = await Promise.all([
    prisma.bodyMetric.findMany({
      where: { date: { gte: from } },
      orderBy: { date: "asc" },
    }),
    prisma.dexaScan.findMany({ orderBy: { scanDate: "asc" } }),
    prisma.bodyMetric.findFirst({ orderBy: { date: "desc" } }),
    prisma.dexaScan.findFirst({ orderBy: { scanDate: "desc" } }),
  ]);

  const weightSeries = metrics.map((m) => ({
    iso: m.date.toISOString(),
    weightKg: m.weightKg,
    bodyFatPct: m.bodyFatPct,
  }));

  const dexaSeries = dexaScans.map((s) => ({
    iso: s.scanDate.toISOString(),
    leanMassKg: s.leanMassKg,
    fatMassKg: s.fatMassKg,
    bodyFatPct: s.bodyFatPct,
  }));

  const hasMetrics = metrics.length > 0;
  const hasDexa = dexaScans.length > 0;

  return (
    <>
      <TopBar title="Body & DEXA" subtitle="Composition, weigh-ins, daily metrics" />
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] space-y-6">
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Weight"
            value={latestMetric?.weightKg != null ? `${latestMetric.weightKg.toFixed(1)} kg` : "—"}
            hint={latestMetric ? format(latestMetric.date, "PP") : "Log your first weigh-in"}
            accentClass="text-fitness"
          />
          <StatCard
            label="Body fat % (DEXA)"
            value={latestDexa?.bodyFatPct != null ? `${latestDexa.bodyFatPct.toFixed(1)}%` : "—"}
            hint={latestDexa ? `Scan ${format(latestDexa.scanDate, "PP")}` : "Add a DEXA scan"}
            accentClass="text-fitness-accent"
          />
          <StatCard
            label="Lean mass (DEXA)"
            value={latestDexa?.leanMassKg != null ? `${latestDexa.leanMassKg.toFixed(2)} kg` : "—"}
            accentClass="text-finance-income"
          />
          <StatCard
            label="DEXA scans"
            value={String(dexaScans.length)}
            hint={`${metrics.length} daily entries (180d)`}
            accentClass="text-finance-invest"
          />
        </section>

        <Tabs defaultValue="daily">
          <TabsList>
            <TabsTrigger value="daily">Daily metrics</TabsTrigger>
            <TabsTrigger value="dexa">DEXA scans</TabsTrigger>
          </TabsList>

          {/* ----- Daily metrics tab ----- */}
          <TabsContent value="daily" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Log today</CardTitle>
                <CardDescription>
                  Weight, body fat (smart scale), waist, RHR, HRV, sleep, steps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BodyMetricForm />
              </CardContent>
            </Card>

            {!hasMetrics ? (
              <EmptyState
                icon={Activity}
                title="No weigh-ins yet"
                description="Add a daily metric above. Trends become more useful with consistent weekly logging."
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Weight — last 180 days</CardTitle>
                </CardHeader>
                <CardContent>
                  <WeightChart data={weightSeries} />
                </CardContent>
              </Card>
            )}

            {hasMetrics ? (
              <Card>
                <CardHeader>
                  <CardTitle>Recent entries</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="text-left font-medium px-4 py-2.5">Date</th>
                          <th className="text-right font-medium px-4 py-2.5">Weight</th>
                          <th className="text-right font-medium px-4 py-2.5">BF%</th>
                          <th className="text-right font-medium px-4 py-2.5">Waist</th>
                          <th className="text-right font-medium px-4 py-2.5">RHR</th>
                          <th className="text-right font-medium px-4 py-2.5">HRV</th>
                          <th className="text-right font-medium px-4 py-2.5">Sleep</th>
                          <th className="text-right font-medium px-4 py-2.5">Steps</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...metrics].reverse().slice(0, 30).map((m) => (
                          <tr key={m.id} className="border-t border-border/40">
                            <td className="px-4 py-2 text-muted-foreground number">
                              {format(m.date, "MMM d, yyyy")}
                            </td>
                            <td className="px-4 py-2 text-right number">
                              {m.weightKg?.toFixed(1) ?? "—"}
                            </td>
                            <td className="px-4 py-2 text-right number">
                              {m.bodyFatPct?.toFixed(1) ?? "—"}
                            </td>
                            <td className="px-4 py-2 text-right number">
                              {m.waistCm?.toFixed(1) ?? "—"}
                            </td>
                            <td className="px-4 py-2 text-right number">
                              {m.restingHrBpm ?? "—"}
                            </td>
                            <td className="px-4 py-2 text-right number">
                              {m.hrvMs?.toFixed(0) ?? "—"}
                            </td>
                            <td className="px-4 py-2 text-right number">
                              {m.sleepHours?.toFixed(1) ?? "—"}
                            </td>
                            <td className="px-4 py-2 text-right number">
                              {m.steps ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          {/* ----- DEXA tab ----- */}
          <TabsContent value="dexa" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Log a DEXA scan</CardTitle>
                <CardDescription>
                  Enter the headline numbers from your scan report. Optional PDF upload is stored
                  locally under <code>uploads/dexa/</code>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DexaForm />
              </CardContent>
            </Card>

            {!hasDexa ? (
              <EmptyState
                icon={Activity}
                title="No DEXA scans yet"
                description="Add your first scan above. Trends across multiple scans (lean vs. fat mass over time) appear once you log two or more."
              />
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Body composition trend</CardTitle>
                    <CardDescription>Lean / fat mass and BF% across all scans</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BodyCompChart data={dexaSeries} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Scan history</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ul className="divide-y divide-border/50">
                      {[...dexaScans].reverse().map((s) => (
                        <li key={s.id} className="px-6 py-4">
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {format(s.scanDate, "PPP")}
                                {s.provider ? (
                                  <Badge variant="outline">{s.provider}</Badge>
                                ) : null}
                                {s.reportFilePath ? (
                                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                                    <FileText className="h-3 w-3" /> report saved
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {s.totalMassKg != null ? `Total ${s.totalMassKg.toFixed(2)} kg · ` : ""}
                                {s.leanMassKg != null ? `Lean ${s.leanMassKg.toFixed(2)} kg · ` : ""}
                                {s.fatMassKg != null ? `Fat ${s.fatMassKg.toFixed(2)} kg · ` : ""}
                                {s.bodyFatPct != null ? `${s.bodyFatPct.toFixed(1)}% BF · ` : ""}
                                {s.bmdGcm2 != null ? `BMD ${s.bmdGcm2.toFixed(3)} g/cm²` : ""}
                              </div>
                              {s.notes ? (
                                <div className="text-xs text-muted-foreground mt-1">{s.notes}</div>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
