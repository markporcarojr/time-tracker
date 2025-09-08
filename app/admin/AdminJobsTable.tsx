"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { JobStatus } from "@/types/prisma";
import { AlertCircle, RefreshCw, Timer } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [filteredJobs, setFilteredJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

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
      const jobsArray = Array.isArray(data?.jobs) ? data.jobs : [];
      setJobs(jobsArray);
      setFilteredJobs(jobsArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setJobs([]);
      setFilteredJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredJobs(jobs);
      return;
    }
    const lower = search.toLowerCase();
    setFilteredJobs(
      jobs.filter(
        (j) =>
          j.customerName.toLowerCase().includes(lower) ||
          j.description?.toLowerCase().includes(lower) ||
          j.user?.name?.toLowerCase().includes(lower) ||
          j.user?.email?.toLowerCase().includes(lower) ||
          j.jobNumber?.toString().includes(lower)
      )
    );
  }, [search, jobs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

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
    <div className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-around px-4 lg:px-6 mb-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[200px] md:w-[300px] rounded-3xl"
          />
          <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <JobsTable data={filteredJobs} isAdmin={true} />
      </div>
    </div>
  );
}
