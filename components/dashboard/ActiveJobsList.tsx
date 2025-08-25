// components/dashboard/ActiveJobsList.tsx
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { fmtHMS } from "@/lib/format";
import { Job } from "@/types/prisma";

export function ActiveJobsList({ jobs }: { jobs: Job[] }) {
  return (
    <Card className="border-border shadow-plate">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Active jobs</CardTitle>
        <Link href="/jobs" className="text-sm underline hover:opacity-80">
          View all jobs
        </Link>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No active jobs yet.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {jobs.map((job) => {
              const savedSec = Math.floor((job.totalMs ?? 0) / 1000);
              return (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className={cn(
                      "block rounded-hard border border-border bg-card p-4 shadow-hard hover:opacity-95"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{job.customerName}</div>
                      <StatusBadge status={job.status} />
                    </div>
                    {job.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {job.description}
                      </p>
                    ) : null}
                    <div className="mt-2 text-xs text-muted-foreground">
                      Saved time:{" "}
                      <span className="font-mono">{fmtHMS(savedSec)}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
