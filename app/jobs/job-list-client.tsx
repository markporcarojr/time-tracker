"use client";

import Link from "next/link";
import * as React from "react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ArrowUpDown, Filter, Plus, Search } from "lucide-react";

import { fmtHMS } from "@/lib/format";
import { convertToHours } from "@/lib/msToHours";
import { liveTotalMs } from "@/lib/utils";
import type { $Enums } from "@prisma/client";
import { Job } from "@prisma/client";
import JobCard from "./JobCard";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface JobListClientProps {
  initialJobs: Job[];
}

type StatusFilter = "ALL" | $Enums.JobStatus;

type SortKey = "created" | "customerName" | "status";
type SortDir = "asc" | "desc";

/* -------------------------------------------------------------------------- */

export default function JobListClient({ initialJobs }: JobListClientProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [deletingJobId, setDeletingJobId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [isPending] = useTransition();

  const counts = useMemo(() => {
    const active = jobs.filter((j) => j.status === "ACTIVE").length;
    const paused = jobs.filter((j) => j.status === "PAUSED").length;
    const done = jobs.filter((j) => j.status === "DONE").length;
    const totalMs = jobs.reduce((acc, j) => acc + j.totalMs, 0);
    return { total: jobs.length, active, paused, done, totalMs };
  }, [jobs]);

  const filteredSorted = useMemo(() => {
    let list = [...jobs];

    // filter
    if (status !== "ALL") list = list.filter((j) => j.status === status);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (j) =>
          j.customerName.toLowerCase().includes(q) ||
          (j.description?.toLowerCase().includes(q) ?? false) ||
          (j.jobNumber !== null && j.jobNumber.toString().includes(q))
      );
    }

    // sort
    list.sort((a, b) => {
      let res = 0;
      if (sortKey === "customerName")
        res = a.customerName.localeCompare(b.customerName);
      else if (sortKey === "status") res = a.status.localeCompare(b.status);
      else res = a.id - b.id; // proxy for created
      return sortDir === "asc" ? res : -res;
    });

    return list;
  }, [jobs, query, status, sortKey, sortDir]);

  const handleDeleteJob = async (jobId: number) => {
    setDeletingJobId(jobId);
    const prev = jobs;
    const next = prev.filter((j) => j.id !== jobId);
    setJobs(next);

    try {
      const response = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!response.ok) {
        setJobs(prev);
        toast.error("Failed to delete job");
      } else {
        toast.success("Job deleted");
      }
    } catch {
      setJobs(prev);
      toast.error("Failed to delete job");
    } finally {
      setDeletingJobId(null);
    }
  };

  /* --------------------------------- UI ---------------------------------- */

  return (
    <div className="space-y-6">
      {/* Hero / Header */}
      <section
        className="
          relative overflow-hidden rounded-3xl border border-border/60
          bg-gradient-to-b from-background to-muted/40
        "
      >
        {/* ambient accents */}
        <div className="pointer-events-none absolute -top-16 -left-20 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 size-80 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
            <p className="text-sm text-muted-foreground">
              Track work at a glance. Filter, sort, and jump back into active
              jobs.
            </p>
          </div>

          <Button
            asChild
            className="
              rounded-full px-5 py-5 text-base font-medium
              bg-gradient-to-r from-primary to-primary/70 text-primary-foreground
              shadow-sm hover:opacity-95
            "
          >
            <Link href="/jobs/new" aria-label="Create new job">
              <Plus className="mr-2 h-4 w-4" />
              New Job
            </Link>
          </Button>
        </div>

        <Separator />

        {/* Stats Strip */}
        <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-5">
          <StatChip label="Total" value={counts.total} tone="muted" />
          <StatChip label="Active" value={counts.active} tone="emerald" />
          <StatChip label="Paused" value={counts.paused} tone="amber" />
          <StatChip
            label="Total Hours"
            value={convertToHours(counts.totalMs) || 0}
            suffix="h"
            tone="primary"
          />
        </div>
      </section>

      {/* Toolbar */}
      <section
        className="
          rounded-2xl border border-border/60 bg-card/70 backdrop-blur
        "
      >
        <div className="grid items-center gap-3 p-4 sm:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search jobs"
              placeholder="Search by customer, description, or job #"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Tabs (segmented) */}
          <div className="sm:col-span-2">
            <Label className="sr-only">Filter status</Label>
            <Tabs
              value={status}
              onValueChange={(v) => setStatus(v as StatusFilter)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-5 rounded-full">
                <TabsTrigger value="ALL" className="rounded-full">
                  All
                </TabsTrigger>
                <TabsTrigger value="ACTIVE" className="rounded-full">
                  Active
                </TabsTrigger>
                <TabsTrigger value="PAUSED" className="rounded-full">
                  Paused
                </TabsTrigger>

                <TabsTrigger value="DONE" className="rounded-full">
                  Done
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <Separator />

        {/* Sort Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>
              Showing{" "}
              <strong className="text-foreground">
                {filteredSorted.length}
              </strong>{" "}
              of <strong className="text-foreground">{jobs.length}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={`${sortKey}:${sortDir}`}
              onValueChange={(val) => {
                const [k, d] = val.split(":") as [SortKey, SortDir];
                setSortKey(k);
                setSortDir(d);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="created:desc">Newest first</SelectItem>
                <SelectItem value="created:asc">Oldest first</SelectItem>
                <SelectItem value="customerName:asc">Name A–Z</SelectItem>
                <SelectItem value="customerName:desc">Name Z–A</SelectItem>
                <SelectItem value="status:asc">Status A–Z</SelectItem>
                <SelectItem value="status:desc">Status Z–A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Content */}
      {jobs.length === 0 ? (
        <EmptyState />
      ) : (
        <Card className="border-border/60 bg-card/70 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">All jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <ul
              className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
              data-testid="job-list"
            >
              {filteredSorted.map((job) => (
                <li key={job.id}>
                  <JobCard
                    job={job}
                    deleting={deletingJobId === job.id}
                    isPending={isPending}
                    onDelete={() => handleDeleteJob(job.id)}
                  />
                </li>
              ))}
            </ul>

            {/* No matches with filters */}
            {filteredSorted.length === 0 && (
              <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No jobs match your filters.
                </p>
                <Button
                  variant="ghost"
                  className="mt-2 rounded-full"
                  onClick={() => {
                    setQuery("");
                    setStatus("ALL");
                    setSortKey("created");
                    setSortDir("desc");
                  }}
                >
                  Reset filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Reusable Bits                                */
/* -------------------------------------------------------------------------- */

function StatChip({
  label,
  value,
  suffix,
  tone = "muted",
}: {
  label: string;
  value: number | string;
  suffix?: string;
  tone?: "muted" | "primary" | "emerald" | "amber" | "sky";
}) {
  const toneMap: Record<string, string> = {
    muted: "ring-border/60",
    primary: "ring-primary/30",
    emerald: "ring-emerald-500/30",
    amber: "ring-amber-500/30",
    sky: "ring-sky-500/30",
  };
  return (
    <div
      className={`
        flex items-center justify-between rounded-xl border border-border/60
        bg-card/70 px-4 py-3 ring-1 ${toneMap[tone]} backdrop-blur
      `}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold">
        {value}
        {suffix ? (
          <span className="ml-0.5 text-muted-foreground">{suffix}</span>
        ) : null}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>All jobs</CardTitle>
        <Button asChild className="rounded-full">
          <Link href="/jobs/new">
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-10 text-center">
          <div className="mb-3 rounded-full bg-muted p-3">
            <Plus className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No jobs yet. Create your first job to get started.
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/jobs/new">Create a job</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
