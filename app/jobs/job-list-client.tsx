"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { fmtHM } from "@/lib/summary";
import { convertToHours } from "@/lib/msToHours";

import { Trash2, Plus, Filter, ArrowUpDown, Search } from "lucide-react";

type Job = {
  id: number;
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

/**
 * Status -> badge styles.
 * Keep variants minimal; use className to colorize within design tokens.
 */
const statusBadgeClass: Record<Job["status"], string> = {
  ACTIVE: "bg-emerald-600/15 text-emerald-600 border-emerald-600/20",
  DONE: "bg-muted text-muted-foreground border-transparent",
  PAUSED: "bg-amber-500/15 text-amber-600 border-amber-600/20",
  MANUAL: "bg-sky-600/15 text-sky-700 border-sky-700/20",
};

export default function JobListClient({ initialJobs }: JobListClientProps) {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>(initialJobs);

  // UI state
  const [deletingJobId, setDeletingJobId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [isPending, startTransition] = useTransition();

  const filteredSorted = useMemo(() => {
    let list = [...jobs];

    // filter
    if (status !== "ALL") {
      list = list.filter((j) => j.status === status);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (j) =>
          j.customerName.toLowerCase().includes(q) ||
          (j.description?.toLowerCase().includes(q) ?? false)
      );
    }

    // sort
    list.sort((a, b) => {
      let res = 0;
      if (sortKey === "customerName") {
        res = a.customerName.localeCompare(b.customerName);
      } else if (sortKey === "status") {
        res = a.status.localeCompare(b.status);
      } else {
        // "created" — we don't have createdAt; keep stable using id as proxy
        res = a.id - b.id;
      }
      return sortDir === "asc" ? res : -res;
    });

    return list;
  }, [jobs, query, status, sortKey, sortDir]);

  const handleDeleteJob = async (jobId: number) => {
    setDeletingJobId(jobId);

    // Optimistic remove
    const prev = jobs;
    const next = prev.filter((j) => j.id !== jobId);
    setJobs(next);

    try {
      const response = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });

      if (!response.ok) {
        // revert on failure
        setJobs(prev);
        toast.error("Failed to delete job");
      } else {
        toast.success("Job deleted successfully");
      }
    } catch (error) {
      setJobs(prev);
      toast.error("Failed to delete job");
    } finally {
      setDeletingJobId(null);
    }
  };

  if (jobs.length === 0) {
    return (
      <Card className="border-border shadow-plate">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All jobs</CardTitle>
          <Button asChild size="sm">
            <Link href="/jobs/new">
              <Plus className="mr-2 h-4 w-4" />
              New Job
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-10 text-center">
            <div className="mb-2 rounded-full bg-muted p-3">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No jobs yet. Create your first job to get started.
            </p>
            <Button asChild className="mt-4">
              <Link href="/jobs/new">Create a job</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-plate">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>All jobs</CardTitle>
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/jobs/new" aria-label="Create new job">
                <Plus className="mr-2 h-4 w-4" />
                New Job
              </Link>
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search jobs"
              placeholder="Search by name or description"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                value={status}
                onValueChange={(v: StatusFilter) => setStatus(v)}
              >
                <SelectTrigger aria-label="Filter by status">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Select
                value={`${sortKey}:${sortDir}`}
                onValueChange={(val) => {
                  const [k, d] = val.split(":") as [SortKey, SortDir];
                  setSortKey(k);
                  setSortDir(d);
                }}
              >
                <SelectTrigger aria-label="Sort jobs">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent align="start">
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
        </div>
      </CardHeader>

      <CardContent>
        <ul
          className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
          data-testid="job-list"
        >
          {filteredSorted.map((job) => (
            <li key={job.id} className="relative">
              <motion.div
                initial={{ y: 0, opacity: 1 }}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="group rounded-2xl border border-border bg-card p-4 shadow-sm ring-1 ring-transparent hover:shadow-md hover:ring-primary/10"
              >
                {/* Clickable body goes to details */}
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex-1 block focus:outline-none min-w-0"
                    aria-label={`Open job ${job.name}`}
                  >
                    <div>
                      <div className="truncate text-base font-semibold">
                        {job.name}
                      </div>
                      {job.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {job.description}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-muted-foreground italic">
                          No description
                        </p>
                      )}
                    </div>
                  </Link>

                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant="outline"
                      className={statusBadgeClass[job.status]}
                    >
                      {job.status}
                    </Badge>
                    <Badge variant="outline">
                      {convertToHours(job.totalMs) || 0}
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete job ${job.name}`}
                          className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          disabled={deletingJobId === job.id || isPending}
                        >
                          {deletingJobId === job.id ? (
                            <Skeleton className="h-4 w-4 rounded" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <div className="flex items-center justify-between mb-4">
                        <Link
                          href={`/jobs/${job.id}/edit`}
                          className="inline-flex items-center rounded-hard bg-primary px-3 py-1.5 text-primary-foreground shadow-hard hover:opacity-90 text-sm"
                        >
                          Edit
                        </Link>
                      </div>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete job</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete “{job.name}”? This
                            cannot be undone and will also delete all associated
                            time sessions.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteJob(job.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </motion.div>
            </li>
          ))}
        </ul>

        {/* No matches state when filters hide everything */}
        {filteredSorted.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No jobs match your filters.
            </p>
            <Button
              variant="ghost"
              className="mt-2"
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
  );
}
