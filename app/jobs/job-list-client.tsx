"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  ArrowUpDown,
  BadgeCheck,
  CirclePause,
  CirclePlay,
  Clock,
  EllipsisVertical,
  Filter,
  Hash,
  Pencil,
  Plus,
  Search,
  Trash2,
  User2,
  Wrench,
} from "lucide-react";

import { convertToHours } from "@/lib/msToHours";
import { JobRow } from "../dashboard/JobsTable";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type Job = {
  id: number;
  jobNumber: number | null;
  customerName: string;
  description: string | null;
  totalMs: number;
  status: "ACTIVE" | "DONE" | "PAUSED" | "MANUAL";
};

interface JobListClientProps {
  initialJobs: Job[];
}

type StatusFilter = "ALL" | Job["status"];
type SortKey = "created" | "customerName" | "status";
type SortDir = "asc" | "desc";

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const STATUS_META = {
  ACTIVE: {
    dot: "bg-emerald-500",
    pill: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
    bar: "bg-gradient-to-r from-emerald-500/70 to-emerald-400/40",
    icon: <CirclePlay className="h-3.5 w-3.5" />,
  },
  PAUSED: {
    dot: "bg-amber-500",
    pill: "bg-amber-500/10 text-amber-600 ring-amber-500/20",
    bar: "bg-gradient-to-r from-amber-500/70 to-amber-400/40",
    icon: <CirclePause className="h-3.5 w-3.5" />,
  },
  MANUAL: {
    dot: "bg-sky-500",
    pill: "bg-sky-500/10 text-sky-700 ring-sky-500/20",
    bar: "bg-gradient-to-r from-sky-500/70 to-sky-400/40",
    icon: <Wrench className="h-3.5 w-3.5" />,
  },
  DONE: {
    dot: "bg-muted-foreground/60",
    pill: "bg-muted text-muted-foreground ring-muted/10",
    bar: "bg-muted",
    icon: <BadgeCheck className="h-3.5 w-3.5" />,
  },
} as const;

function StatusPill({ status }: { status: Job["status"] }) {
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

function Meta({
  icon,
  children,
  title,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
      title={title}
    >
      <span className="opacity-70">{icon}</span>
      <span className="truncate">{children}</span>
    </div>
  );
}

function fmtHMSfromMs(ms: number) {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function liveTotalMs(job: JobRow) {
  if (job.status === "ACTIVE" && job.startedAt) {
    const start = new Date(job.startedAt).getTime();
    return job.totalMs + Math.max(0, Date.now() - start);
  }
  return job.totalMs;
}

function TotalCell({ job }: { job: JobRow }) {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    if (job.status !== "ACTIVE" || !job.startedAt) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [job.status, job.startedAt]);
  return (
    <div className="text-right font-mono">{fmtHMSfromMs(liveTotalMs(job))}</div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export default function JobListClient({ initialJobs }: JobListClientProps) {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [deletingJobId, setDeletingJobId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(() => {
    const active = jobs.filter((j) => j.status === "ACTIVE").length;
    const paused = jobs.filter((j) => j.status === "PAUSED").length;
    const manual = jobs.filter((j) => j.status === "MANUAL").length;
    const done = jobs.filter((j) => j.status === "DONE").length;
    const totalMs = jobs.reduce((acc, j) => acc + j.totalMs, 0);
    return { total: jobs.length, active, paused, manual, done, totalMs };
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
          (j.jobNumber?.toString().includes(q) ?? false)
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
          <StatChip label="Manual" value={counts.manual} tone="sky" />
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
                <TabsTrigger value="MANUAL" className="rounded-full">
                  Manual
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

function JobCard({
  job,
  deleting,
  isPending,
  onDelete,
}: {
  job: Job;
  deleting: boolean;
  isPending: boolean;
  onDelete: () => void;
}) {
  const meta = STATUS_META[job.status];

  return (
    <motion.div
      initial={{ y: 0, opacity: 1 }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div
        className={`
          relative overflow-hidden rounded-2xl border border-border/60 bg-card/80
          shadow-sm ring-1 ring-border/40 backdrop-blur
          hover:shadow-md
        `}
      >
        {/* subtle status accent line */}
        <div className={`absolute inset-x-0 top-0 h-1 ${meta.bar}`} />

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Title / Meta */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/jobs/${job.id}`}
                  className="text-base font-semibold leading-tight hover:underline"
                  aria-label={`Open job ${job.customerName}`}
                >
                  {job.customerName}
                </Link>
                <StatusPill status={job.status} />
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <Meta
                  icon={<Hash className="h-3.5 w-3.5" />}
                  title="Job number"
                >
                  {job.jobNumber ?? (
                    <span className="italic text-muted-foreground">
                      No Job #
                    </span>
                  )}
                </Meta>
                <Meta icon={<User2 className="h-3.5 w-3.5" />} title="Customer">
                  {job.customerName}
                </Meta>
              </div>
            </div>

            {/* Right cluster: time + menu */}
            <div className="flex items-start gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="font-mono text-[11px]">
                      <Clock className="mr-1 h-3.5 w-3.5" />
                      <TotalCell job={job as JobRow} />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="left">Live elapsed time</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                    aria-label="Open actions"
                  >
                    <EllipsisVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4" />
                      View
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/jobs/${job.id}/edit`}
                      className="flex items-center gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        disabled={deleting || isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete job</AlertDialogTitle>
                        <AlertDialogDescription>
                          Delete “{job.customerName}”? This also removes all
                          associated time sessions.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={onDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Description */}
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {job.description || <span className="italic">No description</span>}
          </p>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block size-2 rounded-full ${meta.dot}`}
              />
              <span className="text-xs text-muted-foreground">Status</span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-[11px]">
                {convertToHours(job.totalMs) || 0}h
              </Badge>

              <Button
                asChild
                size="sm"
                className="
                  rounded-full px-3
                  bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground
                  hover:opacity-95
                "
              >
                <Link href={`/jobs/${job.id}`}>Open</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
