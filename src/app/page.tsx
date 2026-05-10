import { TopBar } from "@/components/topbar";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Wallet, LineChart, Apple, Activity, Plus } from "lucide-react";

export default function DashboardPage() {
  return (
    <>
      <TopBar title="Dashboard" subtitle="Today at a glance" />

      <div className="px-6 lg:px-10 py-8 space-y-8 max-w-[1400px]">
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Net worth"
            value="—"
            hint="Connect accounts to begin"
            accentClass="text-finance-invest"
          />
          <StatCard
            label="Spending (30d)"
            value="—"
            hint="No transactions yet"
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

        <section className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Finance
              </CardTitle>
              <CardDescription>
                Plaid connection — link a bank, brokerage, or credit card to sync transactions
                and holdings automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/accounts">
                    <Plus className="h-4 w-4" /> Link an account
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/investments">
                    <LineChart className="h-4 w-4" /> View investments
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" /> Wellness
              </CardTitle>
              <CardDescription>
                Track nutrition (Cronometer), body composition (DEXA), and daily metrics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/nutrition">
                    <Apple className="h-4 w-4" /> Import nutrition
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/body">
                    <Activity className="h-4 w-4" /> Log DEXA
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <EmptyState
            title="Nothing to summarise yet"
            description="Once you connect Plaid and import a Cronometer export, this dashboard will show net worth trend, spending by category, calorie/macro adherence, and body composition over time."
          />
        </section>
      </div>
    </>
  );
}
