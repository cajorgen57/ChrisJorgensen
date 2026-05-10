import { TopBar } from "@/components/topbar";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Scissors } from "lucide-react";

export default function TaxPage() {
  return (
    <>
      <TopBar title="Tax-Loss Harvesting" subtitle="Identify losses worth realizing" />
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>How this will work</CardTitle>
            <CardDescription>What the engine evaluates when generating suggestions</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              For each taxable holding with an unrealized loss, the engine flags
              candidates where harvesting would be material (default threshold:
              $250 minimum loss, configurable in Settings).
            </p>
            <p>
              <strong className="text-foreground">Wash-sale guard:</strong> a 30-day window before
              and after the proposed sale is checked across all linked accounts
              (including IRAs, since IRS rules apply across all accounts you control)
              for purchases of the same or substantially identical security.
            </p>
            <p>
              <strong className="text-foreground">Substitute suggestions:</strong> for each candidate
              the engine offers ETFs/funds that track a similar but not substantially
              identical index (e.g. VOO ↔ IVV would be flagged as too similar; VOO ↔ SPLG
              has been treated as a swap historically — these are heuristics, not legal advice).
            </p>
            <p className="text-xs">
              This is a tool to surface ideas, not tax advice. Always confirm with your
              accountant before acting.
            </p>
          </CardContent>
        </Card>

        <EmptyState
          icon={Scissors}
          title="No candidates to show"
          description="Connect investment accounts in Phase 2/3 and the engine will surface harvestable losses here."
        />
      </div>
    </>
  );
}
