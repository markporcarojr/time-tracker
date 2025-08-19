// app/jobs/[id]/TimerClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Play, Pause, Timer as TimerIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type JobStatus = "ACTIVE" | "PAUSED" | "DONE";

export function fmtHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function TimerClient(props: {
  jobId: number;
  customerName: string;
  description?: string | null;
  totalMs: number;
  startedAtISO: string | null;
  status: JobStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<JobStatus>(props.status);
  const [baseMs, setBaseMs] = useState<number>(props.totalMs);
  const [startedAt, setStartedAt] = useState<number | null>(
    props.startedAtISO ? new Date(props.startedAtISO).getTime() : null
  );

  // Tick every second to display live time
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

  // Light polling to sync if another tab/page changes it
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

  const start = async () => {
    // Send current time as startedAt
    const startedAtISO = new Date().toISOString();
    const res = await fetch(`/api/jobs/${props.jobId}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startedAt: startedAtISO }),
    });
    if (res.ok) {
      setStatus("ACTIVE");
      setStartedAt(Date.now());
      router.refresh();
    }
  };

  const pause = async () => {
    // First, check if the job has a startedAt in the DB
    const resCheck = await fetch(`/api/jobs/${props.jobId}`, {
      cache: "no-store",
    });
    if (resCheck.ok) {
      const { job } = await resCheck.json();
      if (!job.startedAt) {
        // If startedAt is null, start the job instead and send current time
        await start();
        return;
      }
    }
    // Otherwise, proceed to pause
    const res = await fetch(`/api/jobs/${props.jobId}/pause`, {
      method: "POST",
    });
    if (res.ok) {
      const json = await res.json();
      setStatus("PAUSED");
      setStartedAt(json?.startedAt ? new Date(json.startedAt).getTime() : null);
      if (typeof json?.totalMs === "number") setBaseMs(json.totalMs);
      router.refresh();
    }
  };

  const setStatusOnly = async (s: JobStatus) => {
    const res = await fetch(`/api/jobs/${props.jobId}/status`, {
      method: "POST",
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
    <Card className="shadow-plate border-border">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TimerIcon className="h-5 w-5 text-primary" />
            <span>{props.name}</span>
          </CardTitle>
          {props.description ? (
            <p className="text-sm text-muted-foreground mt-1">
              {props.description}
            </p>
          ) : null}
        </div>

        <div className="flex gap-1.5">
          {(["ACTIVE", "PAUSED", "DONE"] as JobStatus[]).map((s) => (
            <Badge
              key={s}
              role="button"
              onClick={() => setStatusOnly(s)}
              variant={status === s ? "default" : "secondary"}
              className={cn(
                "cursor-pointer",
                s === "ACTIVE" && "bg-primary text-primary-foreground",
                s === "DONE" && "bg-ink text-white"
              )}
            >
              {s}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="py-8">
        <div className="text-center">
          <div className="text-[64px] leading-none font-mono tracking-tight">
            {fmtHMS(status === "DONE" ? Math.floor(baseMs / 1000) : displaySec)}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Saved total: <strong>{fmtHMS(Math.floor(baseMs / 1000))}</strong>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {!running ? (
            <Button onClick={start} className="bg-green-600 hover:bg-green-700">
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
          ) : (
            <Button
              onClick={pause}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
