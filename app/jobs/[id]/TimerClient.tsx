// app/jobs/[id]/TimerClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Play, Pause, Timer as TimerIcon, CheckCircle } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Tick every second to display live time
  const [displaySec, setDisplaySec] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recalc = () => {
    // If timer is not active or hasn't started, show saved total
    if (status !== "ACTIVE" || !startedAt) {
      setDisplaySec(Math.floor(baseMs / 1000));
      return;
    }
    
    // Calculate live time when running
    const liveMs = baseMs + (Date.now() - startedAt);
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

  const updateJobStatus = async (newStatus: JobStatus) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/jobs/${props.jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (res.ok) {
        const { job } = await res.json();
        setStatus(job.status);
        setBaseMs(job.totalMs);
        setStartedAt(job.startedAt ? new Date(job.startedAt).getTime() : null);
        
        // If marking as done, redirect to dashboard
        if (newStatus === "DONE") {
          router.push("/dashboard");
        }
      } else {
        console.error("Failed to update job status");
      }
    } catch (error) {
      console.error("Error updating job status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartStop = () => {
    if (status === "ACTIVE") {
      updateJobStatus("PAUSED");
    } else {
      updateJobStatus("ACTIVE");
    }
  };

  const handleMarkCompleted = () => {
    updateJobStatus("DONE");
  };

  return (
    <Card className="shadow-plate border-border">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TimerIcon className="h-5 w-5 text-primary" />
            <span>{props.customerName}</span>
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
              onClick={() => updateJobStatus(s)}
              variant={status === s ? "default" : "secondary"}
              className={cn(
                "cursor-pointer",
                s === "ACTIVE" && "bg-primary text-primary-foreground",
                s === "DONE" && "bg-ink text-white",
                isLoading && "opacity-50 cursor-not-allowed"
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
            {fmtHMS(displaySec)}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {status === "ACTIVE" && startedAt ? (
              <span className="text-green-600 font-semibold">Running...</span>
            ) : status === "DONE" ? (
              <span className="text-gray-600">Completed</span>
            ) : (
              <span>Paused</span>
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Total saved: <strong>{fmtHMS(Math.floor(baseMs / 1000))}</strong>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {status !== "DONE" && (
            <>
              <Button 
                onClick={handleStartStop}
                disabled={isLoading}
                className={cn(
                  status === "ACTIVE" 
                    ? "bg-yellow-600 hover:bg-yellow-700" 
                    : "bg-green-600 hover:bg-green-700"
                )}
              >
                {status === "ACTIVE" ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleMarkCompleted}
                disabled={isLoading}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Completed
              </Button>
            </>
          )}
          
          {status === "DONE" && (
            <div className="text-center">
              <p className="text-green-600 font-semibold mb-2">✓ Job Completed</p>
              <Button 
                onClick={() => router.push("/dashboard")}
                variant="outline"
              >
                Back to Dashboard
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
