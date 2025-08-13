// components/StatusBadge.tsx
import { Badge } from "@/components/ui/badge";

type JobStatus = "ACTIVE" | "PAUSED" | "DONE";

export function StatusBadge({ status }: { status: JobStatus }) {
  const className =
    status === "ACTIVE"
      ? "bg-primary text-primary-foreground"
      : status === "PAUSED"
      ? "bg-muted text-foreground"
      : "bg-foreground text-background";
  return <Badge className={className}>{status}</Badge>;
}
