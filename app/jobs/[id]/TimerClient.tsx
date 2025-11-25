// app/jobs/[id]/TimerClient.tsx
"use client";

import JobTimerDisplay from "@/components/JobTimerDisplay";
import {
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Job } from "@/types/prisma";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Note: Ensure you import from your local UI component, not @radix-ui directly if you have custom styles
import { Pencil, Play, Square, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type JobStatus = "ACTIVE" | "PAUSED" | "DONE";

export default function TimerClient(props: Job) {
  const router = useRouter();

  const [status, setStatus] = useState<JobStatus>(props.status);
  const [baseMs, setBaseMs] = useState<number>(props.totalMs);
  const [startedAt, setStartedAt] = useState<number | null>(
    props.startedAt ? new Date(props.startedAt).getTime() : null
  );

  // live display seconds (base + (now - startedAt) when ACTIVE)
  const [, setDisplaySec] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recalc = () => {
    const liveMs = baseMs + (startedAt ? Date.now() - startedAt : 0);
    setDisplaySec(Math.floor(liveMs / 1000));
  };

  useEffect(() => {
    if (status !== "ACTIVE") return;

    // every hour, force an update so server accumulates time
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${props.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ACTIVE" }),
        });

        if (res.ok) {
          const { job } = await res.json();
          setStatus(job.status);
          setBaseMs(job.totalMs);
          setStartedAt(
            job.startedAt ? new Date(job.startedAt).getTime() : Date.now()
          );
        }
      } catch (err) {
        console.error("Hourly sync failed:", err);
      }
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(id);
  }, [status, props.id]);

  useEffect(() => {
    recalc();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(recalc, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseMs, startedAt]);

  // light polling
  useEffect(() => {
    const id = setInterval(async () => {
      const res = await fetch(`/api/jobs/${props.id}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const { job } = await res.json();
      setStatus(job.status);
      setBaseMs(job.totalMs);
      setStartedAt(job.startedAt ? new Date(job.startedAt).getTime() : null);
    }, 6000);
    return () => clearInterval(id);
  }, [props.id]);

  const start = async () => {
    const res = await fetch(`/api/jobs/${props.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE" }),
    });
    if (res.ok) {
      const { job } = await res.json();
      setStatus(job.status);
      setBaseMs(job.totalMs);
      setStartedAt(
        job.startedAt ? new Date(job.startedAt).getTime() : Date.now()
      );
      router.refresh();
    }
  };

  const stop = async () => {
    const res = await fetch(`/api/jobs/${props.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAUSED" }),
    });
    if (res.ok) {
      const { job } = await res.json();
      setStatus(job.status);
      setBaseMs(job.totalMs);
      setStartedAt(job.startedAt ? new Date(job.startedAt).getTime() : null);
      router.refresh();
    }
  };

  const doDelete = async () => {
    try {
      const p = fetch(`/api/jobs/${props.id}`, { method: "DELETE" }).then(
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

      // If this component is on the specific job page, you should redirect to the list:
      // router.push('/jobs'); 
      // If it's in a list, refresh is fine:
      router.refresh();
    } catch {
      // error handled by toast.promise
    }
  };

  const running = status === "ACTIVE";

  return (
    <Card className="group relative overflow-hidden rounded-2xl border-2 border-border/80 bg-background shadow-lg transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-border/50 via-transparent"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--tw-ring) 1px, transparent 1px), linear-gradient(to bottom, var(--tw-ring) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          // @ts-expect-error -- CSS custom property assignment
          "--tw-ring": "hsl(var(--primary))",
        }}
      />

      <div className="flex flex-col md:flex-row md:items-center p-6 md:p-8 md:gap-8">
        <div className="min-w-0 md:flex-1">
          <CardTitle className="flex items-center gap-2">
            <span className="truncate">{props.customerName.toUpperCase()}</span>
          </CardTitle>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Job: {props.jobNumber}
          </p>
          {props.description && (
            <CardDescription className="mt-2 line-clamp-2">
              {props.description.toUpperCase()}
            </CardDescription>
          )}
        </div>

        <div className="flex flex-col items-start md:items-end mt-4 md:mt-0 md:min-w-[200px]">
          <JobTimerDisplay
            status={status}
            baseMs={baseMs}
            startedAt={startedAt}
            size="xl"
          />
        </div>
      </div>

      <Separator />

      <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Button
          onClick={() => router.push(`/jobs/${props.id}/edit`)}
          variant="outline"
          className="w-full"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit Job
        </Button>

        {!running ? (
          <Button
            onClick={start}
            className="w-full md:col-span-1"
            variant="default"
          >
            <Play className="mr-2 h-4 w-4" />
            Start Timer
          </Button>
        ) : (
          <Button
            onClick={stop}
            className="w-full md:col-span-1"
            variant="default"
          >
            <Square className="mr-2 h-4 w-4" />
            Stop Timer
          </Button>
        )}

        {/* Delete Button with Trigger Pattern */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Job
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete job{" "}
                <span className="font-semibold">{props.jobNumber}</span> and all
                associated timing data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={doDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}