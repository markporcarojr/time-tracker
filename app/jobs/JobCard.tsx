"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import * as React from "react";
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

import { Job } from "@/types/prisma";
import { STATUS_META } from "@/data/statusMeta";
import Meta from "./Meta";
import StatusPill from "./StatusPill";
import { convertToHours } from "@/lib/msToHours";
import { fmtHMSFromMs } from "@/lib/format";

import {
  Clock,
  EllipsisVertical,
  Hash,
  Pencil,
  Trash2,
  User2,
  TimerReset,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                           Local helpers (no casts)                          */
/* -------------------------------------------------------------------------- */

/**
 * Live ticker for ACTIVE jobs.
 * Displays hh:mm:ss derived from job.totalMs + (now - startedAt).
 */
function LiveTotal({
  job,
}: {
  job: Pick<Job, "status" | "startedAt" | "totalMs">;
}) {
  const base = job.totalMs ?? 0;

  const live = useMemo(() => {
    if (job.status !== "ACTIVE" || !job.startedAt) return base;
    return base + (Date.now() - new Date(job.startedAt).getTime());
  }, [base, job.status, job.startedAt]);

  const [ms, setMs] = useState<number>(live);

  useEffect(() => {
    if (job.status !== "ACTIVE" || !job.startedAt) {
      setMs(base);
      return;
    }
    setMs(live);
    const id = setInterval(() => {
      setMs((v) => v + 1000);
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.status, job.startedAt]);

  return <span className="font-mono">{fmtHMSFromMs(ms)}</span>;
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

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
  const meta = STATUS_META[job.status];

  return (
    <motion.div
      initial={{ y: 0, opacity: 1 }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <div
        className={[
          // container
          "group relative overflow-hidden rounded-2xl border",
          "border-border/60 bg-card/80 shadow-sm ring-1 ring-border/40 backdrop-blur",
          "hover:shadow-md",
          // gradient frame
          "before:pointer-events-none before:absolute before:inset-0",
          "before:rounded-2xl before:bg-[radial-gradient(1200px_200px_at_0%_-10%,hsl(var(--primary)/0.12),transparent_60%)]",
          // animated shine
          "after:pointer-events-none after:absolute after:-left-40 after:top-0 after:h-full after:w-40",
          "after:translate-x-[-120%] after:rotate-12 after:bg-gradient-to-r after:from-transparent",
          "after:via-white/10 after:to-transparent after:opacity-0 after:transition",
          "group-hover:after:translate-x-[220%] group-hover:after:opacity-100",
        ].join(" ")}
      >
        {/* slim status bar */}
        <div className={`absolute inset-x-0 top-0 h-1 ${meta.bar}`} />

        {/* soft grid backdrop */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--tw-ring) 1px, transparent 1px), linear-gradient(to bottom, var(--tw-ring) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            // @ts-expect-error CSS custom property assignment
            "--tw-ring": "hsl(var(--border))",
          }}
        />

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
                <StatusPill status={job.status} />
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <Meta icon={<Hash className="h-3.5 w-3.5" />} title="Job #">
                  {job.jobNumber ?? (
                    <span className="italic text-muted-foreground">
                      No Job #
                    </span>
                  )}
                </Meta>
                <Meta icon={<User2 className="h-3.5 w-3.5" />} title="Customer">
                  {job.customerName}
                </Meta>
                {job.startedAt && (
                  <Meta
                    icon={<TimerReset className="h-3.5 w-3.5" />}
                    title="Started"
                  >
                    {new Date(job.startedAt).toLocaleString()}
                  </Meta>
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
                        onSelect={(e) => e.preventDefault()} //
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
                          Delete “{job.jobNumber}”? This will also remove all
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
                className="rounded-full px-3 bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground hover:opacity-95"
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
