"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Save,
  Timer as TimerIcon,
} from "lucide-react";

type JobStatus = "ACTIVE" | "PAUSED" | "DONE";

type Props = {
  jobId: number;
  name: string;
  description: string;
  savedTotalMs: number;
  initialStatus: JobStatus;
};

function fmtHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function TimerPageClient({
  jobId,
  name,
  description,
  savedTotalMs,
  initialStatus,
}: Props) {
  const router = useRouter();
  const storageKey = useMemo(() => `jobTimer:${jobId}`, [jobId]);

  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<JobStatus>(initialStatus);
  const startedAtRef = useRef<number | null>(null);
  const baseAtStartRef = useRef<number>(0);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        setSeconds(data.seconds ?? 0);
        setRunning(Boolean(data.running));
        setStatus((data.status as JobStatus) ?? initialStatus);
        startedAtRef.current = data.startedAt ?? null;
        baseAtStartRef.current = data.seconds ?? 0;
      }
    } catch {}
  }, [storageKey, initialStatus]);

  // persist
  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        seconds,
        running,
        status,
        startedAt: startedAtRef.current,
      })
    );
  }, [seconds, running, status, storageKey]);

  // tick
  useEffect(() => {
    if (!running) return;
    if (!startedAtRef.current) {
      startedAtRef.current = Date.now();
      baseAtStartRef.current = seconds;
    }

    const tick = () => {
      const elapsed = Math.floor(
        (Date.now() - (startedAtRef.current as number)) / 1000
      );
      setSeconds(baseAtStartRef.current + elapsed);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running, seconds]);

  const startLocal = () => {
    if (running) return;
    startedAtRef.current = Date.now();
    baseAtStartRef.current = seconds;
    setRunning(true);
    setStatus("ACTIVE");
  };

  const pauseLocal = () => {
    if (!running) return;
    const now = Date.now();
    const add = Math.floor((now - (startedAtRef.current as number)) / 1000);
    setSeconds(baseAtStartRef.current + add);
    startedAtRef.current = null;
    baseAtStartRef.current = 0;
    setRunning(false);
    setStatus("PAUSED");
  };

  const stopLocal = () => {
    pauseLocal();
    setStatus("DONE");
  };

  const resetLocal = () => {
    startedAtRef.current = null;
    baseAtStartRef.current = 0;
    setRunning(false);
    setSeconds(0);
    setStatus("PAUSED");
  };

  const saveSession = async () => {
    // freeze current session
    pauseLocal();

    const res = await fetch(`/api/jobs/${jobId}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seconds, status }),
    });

    if (!res.ok) {
      alert("Failed to save session");
      return;
    }

    // clear local session
    localStorage.removeItem(storageKey);
    setSeconds(0); // new clean session
    router.refresh();
  };

  const savedSeconds = Math.floor(savedTotalMs / 1000);

  return (
    <Card className="shadow-plate border-border">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TimerIcon className="h-5 w-5 text-primary" />
            <span>{name}</span>
          </CardTitle>
          {description ? (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          ) : null}
        </div>

        {/* Status pills */}
        <div className="flex gap-1.5">
          {(["ACTIVE", "PAUSED", "DONE"] as JobStatus[]).map((s) => (
            <Badge
              key={s}
              variant={status === s ? "default" : "secondary"}
              className={cn(
                "cursor-pointer",
                s === "ACTIVE" &&
                  "bg-primary text-primary-foreground data-[inactive]:bg-secondary",
                s === "DONE" && "bg-ink text-white"
              )}
              onClick={() => setStatus(s)}
            >
              {s}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="py-8">
        {/* Big timer */}
        <div className="text-center">
          <div className="text-[64px] leading-none font-mono tracking-tight">
            {fmtHMS(status === "DONE" ? 0 : seconds)}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Saved total: <strong>{fmtHMS(savedSeconds)}</strong>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {!running ? (
            <Button
              onClick={startLocal}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
          ) : (
            <Button
              onClick={pauseLocal}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          )}
          <Button onClick={stopLocal} className="bg-red-600 hover:bg-red-700">
            <Square className="mr-2 h-4 w-4" />
            Stop
          </Button>
          <Button variant="secondary" onClick={resetLocal}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            onClick={saveSession}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
