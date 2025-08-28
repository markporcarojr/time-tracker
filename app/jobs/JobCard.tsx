"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Clock,
  EllipsisVertical,
  Hash,
  Pencil,
  TimerReset,
  Trash2,
  User2,
} from "lucide-react";

/** ------------------------ Minimal local types ------------------------ */
// If you already have a Job type, delete this block and import yours.
type JobStatus = "ACTIVE" | "PAUSED" | "DONE";
type Job = {
  id: number;
  customerName: string;
  jobNumber: number | null;
  description: string | null;
  status: JobStatus;
  totalMs: number;
  startedAt: string | Date | null;
};

/** ------------------------ Tiny utils (no deps) ------------------------ */
function fmtHMS(ms: number) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

const STATUS_BAR: Record<JobStatus, string> = {
  ACTIVE: "bg-emerald-500",
  PAUSED: "bg-amber-500",
  DONE: "bg-zinc-400",
};

const STATUS_PILL: Record<JobStatus, string> = {
  ACTIVE:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  PAUSED:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  DONE: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
};

/** Live ticker for ACTIVE jobs (hh:mm:ss from totalMs + elapsed) */
function LiveTotal({
  job,
}: {
  job: Pick<Job, "status" | "startedAt" | "totalMs">;
}) {
  const base = job.totalMs ?? 0;

  // 1) Stabilize startedAt as a primitive number (ms since epoch)
  const startedAtMs = useMemo<number | null>(() => {
    if (!job.startedAt) return null;
    if (typeof job.startedAt === "string") {
      const t = Date.parse(job.startedAt);
      return Number.isFinite(t) ? t : null;
    }
    return job.startedAt.getTime();
  }, [job.startedAt]);

  // 2) Compute the initial live value from stable deps
  const liveStart = useMemo(() => {
    if (job.status !== "ACTIVE" || startedAtMs == null) return base;
    return base + (Date.now() - startedAtMs);
  }, [base, job.status, startedAtMs]);

  // 3) Drive UI with state that ticks every second while ACTIVE
  const [ms, setMs] = useState<number>(liveStart);

  useEffect(() => {
    if (job.status !== "ACTIVE" || startedAtMs == null) {
      setMs(base);
      return;
    }
    setMs(liveStart);
    const id = setInterval(() => setMs((v) => v + 1000), 1000);
    return () => clearInterval(id);
  }, [job.status, startedAtMs, base, liveStart]);

  return <span className="font-mono">{fmtHMS(ms)}</span>;
}

/** ------------------------------- Component ------------------------------- */
export default function JobCard({
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
  const barClass = STATUS_BAR[job.status];

  return (
    <motion.div
      initial={{ y: 0, opacity: 1 }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <div
        className={[
          "group relative overflow-hidden rounded-2xl border",
          "border-border/60 bg-card/80 shadow-sm ring-1 ring-border/40 backdrop-blur",
          "hover:shadow-md",
        ].join(" ")}
      >
        {/* slim status bar */}
        <div className={`absolute inset-x-0 top-0 h-1 ${barClass}`} />

        <div className="relative p-4 sm:p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            {/* Left: title & meta */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/jobs/${job.id}`}
                  className="truncate text-base font-semibold leading-tight hover:underline"
                  aria-label={`Open job ${job.customerName}`}
                  title={job.customerName}
                >
                  {job.customerName}
                </Link>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  <span className="font-medium">Job #:</span>{" "}
                  {job.jobNumber ?? <span className="italic">No Job #</span>}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <User2 className="h-3.5 w-3.5" />
                  <span className="font-medium">Customer:</span>{" "}
                  {job.customerName}
                </span>
                {job.startedAt && (
                  <span className="inline-flex items-center gap-1.5">
                    <TimerReset className="h-3.5 w-3.5" />
                    <span className="font-medium">Started:</span>{" "}
                    {new Date(job.startedAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Right: live timer + menu */}
            <div className="flex items-start gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="font-mono text-[11px]">
                      <Clock className="mr-1 h-3.5 w-3.5" />
                      <LiveTotal job={job} />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    {job.status === "ACTIVE"
                      ? "Live elapsed time"
                      : "Total time"}
                  </TooltipContent>
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
                        onSelect={(e) => e.preventDefault()}
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
                          Delete “{job.jobNumber ?? job.customerName}”? This
                          will also remove all associated time sessions.
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
          {job.description ? (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {job.description}
            </p>
          ) : (
            <p className="mt-2 text-sm italic text-muted-foreground">
              No description
            </p>
          )}

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            <span
              className={[
                "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium",
                STATUS_PILL[job.status],
              ].join(" ")}
              aria-label={`Status: ${job.status}`}
            >
              <span
                className={[
                  "inline-block h-2 w-2 rounded-full",
                  job.status === "ACTIVE"
                    ? "bg-emerald-500"
                    : job.status === "PAUSED"
                    ? "bg-amber-500"
                    : "bg-zinc-500",
                ].join(" ")}
              />
              {job.status}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
