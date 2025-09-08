"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

// If you're passing jobs that include user info, use AdminJob instead of Job.
type AdminJob = {
  id: number;
  jobNumber: number | null;
  customerName: string;
  description: string | null;
  totalMs: number;
  user?: {
    name: string | null;
    email: string | null;
  } | null;
};

export function JobsTable({
  data,
  isAdmin = false,
}: {
  data: AdminJob[];
  isAdmin?: boolean;
}) {
  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6 mb-4">
        <div className="text-sm text-muted-foreground">
          {data.length} job(s)
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job #</TableHead>
              <TableHead>Job</TableHead>
              <TableHead className="hidden md:table-cell">
                Total Hours
              </TableHead>
              {isAdmin && <TableHead>User</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length > 0 ? (
              data.map((job) => (
                <Link
                  href={`/jobs/${job.id}`}
                  className="contents"
                  key={job.id}
                >
                  <TableRow className="cursor-pointer hover:bg-muted">
                    <TableCell>
                      {job.jobNumber !== null
                        ? job.jobNumber.toString().padStart(4, "0")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <span className="fw-extrabold text-xl">
                        {job.customerName}
                      </span>
                      {job.description && (
                        <div className="text-xs text-muted-foreground">
                          {job.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {(job.totalMs / 1000 / 60 / 60).toFixed(1)} h
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="text-sm font-medium">
                          {job.user?.name ?? "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {job.user?.email ?? "—"}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                </Link>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 4 : 3}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
