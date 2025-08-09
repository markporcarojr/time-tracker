"use client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type JobStatus = "ACTIVE" | "PAUSED" | "DONE";

export function StatusPills({
  value,
  onChange,
}: {
  value: JobStatus;
  onChange: (v: JobStatus) => void;
}) {
  const options: JobStatus[] = ["ACTIVE", "PAUSED", "DONE"];
  return (
    <div className="flex gap-1.5">
      {options.map((s) => (
        <Badge
          key={s}
          variant={value === s ? "default" : "secondary"}
          className={cn(
            "cursor-pointer",
            s === "ACTIVE" && "bg-primary text-primary-foreground",
            s === "DONE" && "bg-ink text-white"
          )}
          onClick={() => onChange(s)}
        >
          {s}
        </Badge>
      ))}
    </div>
  );
}
