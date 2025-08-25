import { Badge } from "@/components/ui/badge";
import { STATUS_META } from "@/data/statusMeta";
import { Job } from "@/types/prisma";

export default function StatusPill({ status }: { status: Job["status"] }) {
  const meta = STATUS_META[status];
  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 border-0 ring-1 ${meta.pill}`}
    >
      {meta.icon}
      <span className="text-[11px] font-medium tracking-wide">{status}</span>
    </Badge>
  );
}
