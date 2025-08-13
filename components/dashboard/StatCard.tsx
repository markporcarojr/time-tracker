// components/dashboard/StatCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function StatCard({
  title,
  value,
  progressPct,
  hint,
}: {
  title: string;
  value: React.ReactNode;
  progressPct?: number;
  hint?: string;
}) {
  return (
    <Card className="border-border shadow-plate">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-2xl font-mono">{value}</div>
        {typeof progressPct === "number" && <Progress value={progressPct} />}
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}
