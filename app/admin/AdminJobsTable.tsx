"use client";

import { useEffect, useMemo, useState } from "react";
import { JobStatus } from "@/types/prisma";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, Timer, User2 } from "lucide-react";

interface AdminJob {
  id: number;
  jobNumber: number | null;
  customerName: string;
  description: string | null;
  status: JobStatus;
  startedAt: string | null;
  stoppedAt: string | null;
  totalMs: number;
  userId: number;
  user: {
    id: number;
    name: string | null;
    email: string | null;
  };
}

export function AdminJobsTable() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchJobs() {
    try {
      setError(null);
      const response = await fetch("/api/admin/jobs", { cache: "no-store" });
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Unauthorized – Admin access required");
        }
        throw new Error("Failed to fetch jobs");
      }
      const data = await response.json();
      setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchJobs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const formatTime = (ms: number) => {
    if (!ms) return "0:00:00";
    const hours = Math.floor(ms / 3_600_000);
    const minutes = Math.floor((ms % 3_600_000) / 60_000);
    const seconds = Math.floor((ms % 60_000) / 1_000);
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "–";
    // If you want consistent tz/format, consider date-fns or dayjs across the app.
    return new Date(dateString).toLocaleString();
  };

  const statusBadgeClass = (status: JobStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "PAUSED":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "DONE":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      default:
        return "bg-muted text-foreground";
    }
  };

  const totalTracked = useMemo(() => {
    return jobs.reduce((acc, j) => acc + (j?.totalMs || 0), 0);
  }, [jobs]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Jobs
            </CardTitle>
            <CardDescription>Admin view of all tracked jobs</CardDescription>
          </div>
          <Button variant="outline" disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="grid grid-cols-8 gap-3">
                {[...Array(8)].map((__, j) => (
                  <Skeleton key={j} className="h-6 w-full" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Jobs
            </CardTitle>
            <CardDescription>Admin view of all tracked jobs</CardDescription>
          </div>
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Couldn’t load jobs</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Jobs
          </CardTitle>
          <CardDescription>
            Admin view of all tracked jobs • Total time:{" "}
            {formatTime(totalTracked)}
          </CardDescription>
        </div>
        <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead className="min-w-[220px]">User</TableHead>
                <TableHead className="min-w-[90px]">Job #</TableHead>
                <TableHead className="min-w-[180px]">Customer</TableHead>
                <TableHead className="min-w-[260px]">Description</TableHead>
                <TableHead className="min-w-[110px]">Status</TableHead>
                <TableHead className="min-w-[120px]">Total Time</TableHead>
                <TableHead className="min-w-[180px]">Started</TableHead>
                <TableHead className="min-w-[180px]">Stopped</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No jobs found
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full border p-1">
                          <User2 className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {job.user.name?.trim() || "Unknown"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {job.user.email || "—"}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>{job.jobNumber ?? "—"}</TableCell>
                    <TableCell className="font-medium">
                      {job.customerName}
                    </TableCell>

                    <TableCell className="max-w-[360px]">
                      <span className="line-clamp-2 text-sm text-muted-foreground">
                        {job.description || "—"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge className={statusBadgeClass(job.status)}>
                        {job.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="font-mono text-sm">
                      {formatTime(job.totalMs)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(job.startedAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(job.stoppedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
