import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  trend?: { value: string; positive?: boolean };
  accentClass?: string;
}

export function StatCard({ label, value, hint, trend, accentClass }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-40",
          accentClass ?? "text-primary"
        )}
      />
      <CardContent className="p-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-2 text-2xl font-semibold number">{value}</div>
        <div className="mt-1 flex items-center gap-2 text-xs">
          {trend ? (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 font-medium number",
                trend.positive
                  ? "bg-finance-income/10 text-finance-income"
                  : "bg-finance-spend/10 text-finance-spend"
              )}
            >
              {trend.value}
            </span>
          ) : null}
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}
