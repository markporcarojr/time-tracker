"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Play, Pause, Save, Timer as TimerIcon } from "lucide-react";

type JobStatus = "ACTIVE" | "PAUSED" | "DONE";

type TimerSession = {
  seconds: number;
  running: boolean;
  status: JobStatus;
  startedAt: number | null;
  baseAtStart: number;
  saved: boolean;
  sessionId: string;
};

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

function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now();
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

  // Main state
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<JobStatus>(initialStatus);
  const [sessionId, setSessionId] = useState<string>(generateSessionId());
  const [saved, setSaved] = useState<boolean>(false);

  // Timer control refs
  const startedAtRef = useRef<number | null>(null);
  const baseAtStartRef = useRef<number>(0);
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Hydrate from localStorage
  const hydrateFromStorage = () => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const data: TimerSession = JSON.parse(raw);
      setRunning(Boolean(data.running));
      setStatus((data.status as JobStatus) ?? initialStatus);
      startedAtRef.current = data.startedAt ?? null;
      baseAtStartRef.current = data.baseAtStart ?? 0;
      setSessionId(data.sessionId ?? generateSessionId());
      setSaved(Boolean(data.saved));
      if (data.running && data.startedAt) {
        const now = Date.now();
        const elapsed = Math.floor((now - data.startedAt) / 1000);
        setSeconds((data.baseAtStart ?? 0) + elapsed);
      } else {
        setSeconds(data.seconds ?? 0);
      }
    } else {
      // If nothing in storage, reset to initial
      setSeconds(0);
      setRunning(false);
      setStatus(initialStatus);
      startedAtRef.current = null;
      baseAtStartRef.current = 0;
      setSessionId(generateSessionId());
      setSaved(false);
    }
  };

  // Hydrate on mount and on visibilitychange
  useEffect(() => {
    hydrateFromStorage();
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        hydrateFromStorage();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Sync across windows/tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        hydrateFromStorage();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line
  }, []);

  // Persist every change to localStorage
  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        seconds,
        running,
        status,
        startedAt: startedAtRef.current,
        baseAtStart: baseAtStartRef.current,
        saved,
        sessionId,
      })
    );
  }, [seconds, running, status, saved, sessionId, storageKey]);

  // Timer ticking effect
  useEffect(() => {
    if (!running) {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      return;
    }
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
    tickIntervalRef.current = setInterval(tick, 1000);
    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
    // Only depend on running!
    // eslint-disable-next-line
  }, [running]);

  // Start timer (new session, clear saved)
  const startLocal = () => {
    if (running) return;
    startedAtRef.current = Date.now();
    baseAtStartRef.current = seconds;
    setSessionId(generateSessionId());
    setSaved(false);
    setRunning(true);
    setStatus("ACTIVE");
  };

  // Pause timer
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

  // Save session (only once per session)
  const saveSession = async () => {
    if (saved) {
      alert("This session has already been saved.");
      return;
    }
    pauseLocal();
    const res = await fetch(`/api/jobs/${jobId}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seconds, status, sessionId }),
    });
    if (!res.ok) {
      alert("Failed to save session");
      return;
    }
    setSaved(true);
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        seconds,
        running,
        status,
        startedAt: startedAtRef.current,
        baseAtStart: baseAtStartRef.current,
        saved: true,
        sessionId,
      })
    );
    setSeconds(0);
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
        <div className="text-center">
          <div className="text-[64px] leading-none font-mono tracking-tight">
            {fmtHMS(status === "DONE" ? 0 : seconds)}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Saved total: <strong>{fmtHMS(savedSeconds)}</strong>
          </div>
        </div>
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
          <Button
            onClick={saveSession}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={saved}
          >
            <Save className="mr-2 h-4 w-4" />
            {saved ? "Already Saved" : "Save Session"}
          </Button>
        </div>
        <div className="mt-2 text-sm text-muted-foreground text-center">
          Timer persists as you move between pages, reload, or return, until
          paused or saved.
          <br />
          <span className="text-red-500 font-bold">Note:</span> Saving in one
          window marks the session as saved everywhere. Start a new session to
          track new time.
        </div>
      </CardContent>
    </Card>
  );
}
