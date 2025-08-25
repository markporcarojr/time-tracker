// app/jobs/[id]/TimerClient.tsx
"use client";

import {
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn, fmtHMS } from "@/lib/utils";
import type { $Enums } from "@prisma/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@radix-ui/react-alert-dialog";
import { Play, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type JobStatus = $Enums.JobStatus;

export default function TimerClient(props: {
  jobId: number;
  jobNumber: number;
  status: JobStatus;
  totalMs: number;
  startedAtISO?: string | null;
  customerName: string;
  description?: string | null;
}) {
  const router = useRouter();

  const [status, setStatus] = useState<JobStatus>(props.status);
  const [baseMs, setBaseMs] = useState<number>(props.totalMs);
  const [startedAt, setStartedAt] = useState<number | null>(
    props.startedAtISO ? new Date(props.startedAtISO).getTime() : null
  );

  // live display seconds (base + (now - startedAt) when ACTIVE)
  const [displaySec, setDisplaySec] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recalc = () => {
    const liveMs = baseMs + (startedAt ? Date.now() - startedAt : 0);
    setDisplaySec(Math.floor(liveMs / 1000));
  };

  useEffect(() => {
    recalc();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(recalc, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseMs, startedAt]);

  // light polling to catch changes from other tabs
  useEffect(() => {
    const id = setInterval(async () => {
      const res = await fetch(`/api/jobs/${props.jobId}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const { job } = await res.json();
      setStatus(job.status);
      setBaseMs(job.totalMs);
      setStartedAt(job.startedAt ? new Date(job.startedAt).getTime() : null);
    }, 6000);
    return () => clearInterval(id);
  }, [props.jobId]);

  // Start => PATCH { status: "ACTIVE" } (server sets startedAt)
  const start = async () => {
    const res = await fetch(`/api/jobs/${props.jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE" }),
    });
    if (res.ok) {
      const { job } = await res.json();
      setStatus(job.status); // "ACTIVE"
      setBaseMs(job.totalMs);
      setStartedAt(
        job.startedAt ? new Date(job.startedAt).getTime() : Date.now()
      );
      router.refresh();
    }
  };

  // Stop => PATCH { status: "PAUSED" } (server accumulates totalMs, clears startedAt)
  const stop = async () => {
    const res = await fetch(`/api/jobs/${props.jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAUSED" }),
    });
    if (res.ok) {
      const { job } = await res.json();
      setStatus(job.status); // "PAUSED"
      setBaseMs(job.totalMs);
      setStartedAt(job.startedAt ? new Date(job.startedAt).getTime() : null);
      router.refresh();
    }
  };

  const doDelete = async () => {
    try {
      const p = fetch(`/api/jobs/${props.jobId}`, { method: "DELETE" }).then(
        async (res) => {
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(text || "Delete failed");
          }
        }
      );

      toast.promise(p, {
        loading: "Deleting…",
        success: "Job deleted",
        error: (err: unknown) =>
          err instanceof Error ? err.message : "Delete failed",
      });

      router.refresh();
    } catch (err) {
      // error handled by toast.promise
    }
  };

  // direct status change via badges (ACTIVE/PAUSED/DONE)
  const setStatusOnly = async (s: JobStatus) => {
    const res = await fetch(`/api/jobs/${props.jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    if (res.ok) {
      const { job } = await res.json();
      setStatus(job.status);
      setBaseMs(job.totalMs);
      setStartedAt(job.startedAt ? new Date(job.startedAt).getTime() : null);
      router.refresh();
    }
  };

  const running = status === "ACTIVE";

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card/80 ring-1 ring-border/40 backdrop-blur shadow-plate transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-md"
      )}
    >
      {/* status bar */}

      {/* soft grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--tw-ring) 1px, transparent 1px), linear-gradient(to bottom, var(--tw-ring) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          // @ts-ignore
          "--tw-ring": "hsl(var(--border))",
        }}
      />

      {/* shine */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-0 h-full w-40 -translate-x-[120%] rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition duration-700 group-hover:translate-x-[220%] group-hover:opacity-100"
      />

      <CardHeader className="relative z-[1] flex flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2">
            <span className="truncate">{props.customerName.toUpperCase()}</span>
          </CardTitle>
          <div>{props.jobNumber}</div>
        </div>
        <div>
          {props.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {props.description.toUpperCase()}
            </p>
          ) : null}
        </div>

        {/* status badges?? */}
      </CardHeader>

      <Separator className="relative z-[1]" />

      <CardContent className="relative z-[1] py-8">
        <div className="text-center">
          <div className="font-mono text-[56px] leading-none tracking-tight sm:text-[64px]">
            {fmtHMS(running ? displaySec : Math.floor(baseMs / 1000))}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Saved total: <strong>{fmtHMS(Math.floor(baseMs / 1000))}</strong>
            {running ? <span className="ml-2">(live)</span> : null}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-between gap-3">
          <Button
            onClick={start}
            className="rounded-full bg-emerald-600 px-5 hover:bg-emerald-700"
            aria-label="Start timing"
          >
            <Play className="mr-2 h-4 w-4" />
            Start
          </Button>
          {!running ? (
            <Button
              onClick={start}
              className="rounded-full bg-emerald-600 px-5 hover:bg-emerald-700"
              aria-label="Start timing"
            >
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
          ) : (
            <Button
              onClick={stop}
              className="rounded-full bg-red-600 px-5 hover:bg-red-700"
              aria-label="Stop timing"
            >
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="rounded-full px-5"
                aria-label="Delete job"
              >
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete “{props.jobNumber}”?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the job and all timing data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={doDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
