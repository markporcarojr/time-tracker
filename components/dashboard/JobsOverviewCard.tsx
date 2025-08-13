// components/dashboard/JobsOverviewCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type JobStatus = "ACTIVE" | "PAUSED" | "DONE";

export function JobsOverviewCard({
  totals,
}: {
  totals: { all: number; active: number; done: number };
}) {
  return (
    <Card className="border-border shadow-plate">
      <CardHeader>
        <CardTitle className="text-base">Jobs overview</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <Badge variant="secondary" className="text-xs">
          All: {totals.all}
        </Badge>
        <Badge className="bg-primary text-primary-foreground text-xs">
          Active: {totals.active}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          Done: {totals.done}
        </Badge>
      </CardContent>
    </Card>
  );
}
