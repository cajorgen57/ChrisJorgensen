import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center text-center py-16 px-6">
        {Icon ? (
          <div className="mb-4 rounded-full bg-muted p-3">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
        ) : null}
        <h3 className="text-base font-semibold">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground max-w-md">{description}</p>
        ) : null}
        {action ? <div className="mt-6">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
