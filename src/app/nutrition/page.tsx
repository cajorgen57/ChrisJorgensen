import { TopBar } from "@/components/topbar";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Apple } from "lucide-react";

export default function NutritionPage() {
  return (
    <>
      <TopBar title="Nutrition" subtitle="Cronometer imports + macro/micro trends" />
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>How import will work</CardTitle>
            <CardDescription>Cronometer → CSV → here</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              In Cronometer, go to <em>Settings → Account → Export Data → Servings</em>
              and download a CSV for your desired date range.
            </p>
            <p>
              Phase 4 adds an upload page that parses the file, dedupes by row hash,
              and displays daily and rolling-7-day charts for calories, macros (P/C/F),
              fiber, and key micros.
            </p>
          </CardContent>
        </Card>

        <EmptyState
          icon={Apple}
          title="No nutrition data yet"
          description="Cronometer CSV upload coming in Phase 4."
        />
      </div>
    </>
  );
}
