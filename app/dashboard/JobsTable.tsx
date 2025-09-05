"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Job } from "@/types/prisma";
import Link from "next/link";

export function JobsTable({ data }: { data: Job[] }) {
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
              <TableHead>Job</TableHead>
              <TableHead>Job #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total Hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="fw-extrabold text-xl"
                    >
                      {job.customerName}
                    </Link>
                    {job.description && (
                      <div className="text-xs text-muted-foreground">
                        {job.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {job.jobNumber !== null
                      ? job.jobNumber.toString().padStart(4, "0")
                      : "-"}
                  </TableCell>
                  <TableCell>{job.status}</TableCell>
                  <TableCell>
                    {(job.totalMs / 1000 / 60 / 60).toFixed(1)} h
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
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
