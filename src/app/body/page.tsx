import { TopBar } from "@/components/topbar";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity } from "lucide-react";

export default function BodyPage() {
  return (
    <>
      <TopBar title="Body & DEXA" subtitle="Composition, weigh-ins, daily metrics" />
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tracking plan</CardTitle>
            <CardDescription>What gets logged here</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">DEXA scans:</strong> manual entry of headline numbers
              (lean mass, fat mass, BF%, VAT, BMD). PDF report can be uploaded for safekeeping —
              files live in <code className="text-xs">/uploads</code> outside git.
            </p>
            <p>
              <strong className="text-foreground">Daily metrics:</strong> weight, body fat % (smart scale),
              waist, resting HR, HRV, sleep, steps. Charts trend over weeks/months.
            </p>
            <p>
              Phase 5 wires up the entry forms and progress charts.
            </p>
          </CardContent>
        </Card>

        <EmptyState
          icon={Activity}
          title="No body data yet"
          description="DEXA + body comp tracking coming in Phase 5."
        />
      </div>
    </>
  );
}
