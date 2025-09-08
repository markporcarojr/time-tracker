"use client";

import { JobStatus } from "@/types/prisma";
import { useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw, Timer } from "lucide-react";
import { JobsTable } from "../dashboard/JobsTable";

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
        <JobsTable data={jobs} isAdmin={true} />
      </CardContent>
    </Card>
  );
}
