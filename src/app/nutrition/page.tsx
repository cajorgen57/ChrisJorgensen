import { TopBar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Apple } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { NutritionUpload } from "@/components/nutrition-upload";
import { CalorieLineChart, MacrosBarChart } from "@/components/nutrition-charts";
import { getDailyTotals, getRollingAverage, getImportHistory } from "@/lib/nutrition-queries";
import { formatNumber } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function NutritionPage() {
  const to = new Date();
  to.setUTCHours(0, 0, 0, 0);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 89); // 90 days

  const [daily, avg7, avg30, imports] = await Promise.all([
    getDailyTotals(from, to),
    getRollingAverage(7),
    getRollingAverage(30),
    getImportHistory(),
  ]);

  const hasData = daily.some((d) => d.energyKcal > 0);
  const chartData = daily.map((d) => ({
    iso: d.date.toISOString(),
    energyKcal: d.energyKcal,
    proteinG: d.proteinG,
    carbsG: d.carbsG,
    fatG: d.fatG,
    fiberG: d.fiberG,
  }));

  return (
    <>
      <TopBar title="Nutrition" subtitle="Cronometer imports + macro/micro trends" />
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Import</CardTitle>
            <CardDescription>
              Upload a Cronometer Servings CSV. Re-imports are deduped automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NutritionUpload />
          </CardContent>
        </Card>

        {!hasData ? (
          <EmptyState
            icon={Apple}
            title="No nutrition data yet"
            description="Upload your first Cronometer CSV above. Trends and rolling averages will appear once data is imported."
          />
        ) : (
          <>
            <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Calories (avg 7d)"
                value={avg7 ? `${formatNumber(avg7.energyKcal)} kcal` : "—"}
                hint={avg7 ? `${formatNumber(avg7.proteinG)}g protein` : "Not enough data"}
                accentClass="text-fitness"
              />
              <StatCard
                label="Calories (avg 30d)"
                value={avg30 ? `${formatNumber(avg30.energyKcal)} kcal` : "—"}
                accentClass="text-fitness-accent"
              />
              <StatCard
                label="Protein (avg 7d)"
                value={avg7 ? `${formatNumber(avg7.proteinG)} g` : "—"}
                accentClass="text-finance-income"
              />
              <StatCard
                label="Fiber (avg 7d)"
                value={avg7 ? `${formatNumber(avg7.fiberG)} g` : "—"}
                accentClass="text-finance-invest"
              />
            </section>

            <Card>
              <CardHeader>
                <CardTitle>Calories — last 90 days</CardTitle>
                <CardDescription>Daily totals from logged servings</CardDescription>
              </CardHeader>
              <CardContent>
                <CalorieLineChart data={chartData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Macros — last 90 days</CardTitle>
                <CardDescription>Stacked grams of protein, carbs, fat</CardDescription>
              </CardHeader>
              <CardContent>
                <MacrosBarChart data={chartData} />
              </CardContent>
            </Card>
          </>
        )}

        {imports.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Recent imports</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border/50">
                {imports.map((b) => (
                  <li key={b.id} className="px-6 py-3 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{b.filename ?? "(unnamed file)"}</div>
                      <div className="text-xs text-muted-foreground">
                        {b.startDate && b.endDate
                          ? `${format(b.startDate, "PP")} – ${format(b.endDate, "PP")}`
                          : "—"}
                        {" · "}
                        imported {formatDistanceToNow(b.createdAt, { addSuffix: true })}
                      </div>
                    </div>
                    <div className="number text-muted-foreground">
                      {b.rowsImported} rows
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
