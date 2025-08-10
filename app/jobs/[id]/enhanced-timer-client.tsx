// app/jobs/[id]/enhanced-timer-client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
// import type { JobStatus } from "@prisma/client";
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
  Plus,
  Timer as TimerIcon,
} from "lucide-react";

// Temporary type definition until Prisma client is regenerated
type JobStatus = "ACTIVE" | "PAUSED" | "DONE" | "MANUAL";

type TimerState = {
  id: number;
  name: string;
  description: string | null;
  status: JobStatus;
  totalMilliseconds: number;
  runningSince: string | null;
  isRunning: boolean;
  activeTimeEntry: any | null;
};

type Props = {
  jobId: number;
  initialState: TimerState;
};

function fmtHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function EnhancedTimerClient({ jobId, initialState }: Props) {
  const router = useRouter();
  const [timerState, setTimerState] = useState<TimerState>(initialState);
  const [liveDelta, setLiveDelta] = useState(0);
  const [loading, setLoading] = useState(false);

  // Calculate base seconds from DB total
  const baseSeconds = useMemo(
    () => Math.floor((timerState.totalMilliseconds || 0) / 1000),
    [timerState.totalMilliseconds]
  );

  // Live timer tick for active sessions
  useEffect(() => {
    if (!timerState.isRunning || !timerState.runningSince || timerState.status !== "ACTIVE") {
      setLiveDelta(0);
      return;
    }
    
    const started = new Date(timerState.runningSince).getTime();
    const tick = () => setLiveDelta(Math.floor((Date.now() - started) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timerState.isRunning, timerState.runningSince, timerState.status]);

  // Hydrate latest state from database
  const refreshState = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/session`);
      if (res.ok) {
        const newState = await res.json();
        setTimerState(newState);
      }
    } catch (error) {
      console.error("Failed to refresh timer state:", error);
    }
  };

  // Session action handler
  const handleAction = async (action: string, status?: JobStatus, minutes?: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, status, minutes }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Error: ${error.error}`);
        return;
      }

      // Refresh state from DB
      await refreshState();
      router.refresh();
    } catch (error) {
      console.error("Timer action failed:", error);
      alert("Timer action failed");
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => handleAction("start", "ACTIVE");
  const pauseTimer = () => handleAction("pause", "PAUSED");
  const stopTimer = () => handleAction("stop", "DONE");
  
  const addManual = async () => {
    const minutes = Number(prompt("Add manual minutes:", "15") || 0);
    if (minutes > 0) {
      await handleAction("manual", "MANUAL", minutes);
    }
  };

  const resetTimer = () => handleAction("stop", "PAUSED");

  // displaySeconds = base + live delta while running
  const displaySeconds = baseSeconds + (timerState.isRunning ? liveDelta : 0);

  const statusBadgeColors: Record<JobStatus, string> = {
    ACTIVE: "bg-green-600 text-white",
    PAUSED: "bg-yellow-600 text-white", 
    DONE: "bg-red-600 text-white",
    MANUAL: "bg-blue-600 text-white",
  };

  return (
    <Card className="shadow-plate border-border">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TimerIcon className="h-5 w-5 text-primary" />
            <span>{timerState.name}</span>
          </CardTitle>
          {timerState.description ? (
            <p className="text-sm text-muted-foreground mt-1">
              {timerState.description}
            </p>
          ) : null}
        </div>

        {/* Status badge */}
        <Badge
          className={cn(
            "cursor-default",
            statusBadgeColors[timerState.status]
          )}
        >
          {timerState.status}
        </Badge>
      </CardHeader>

      <Separator />

      <CardContent className="py-8">
        {/* Big timer display */}
        <div className="text-center">
          <div className="text-[64px] leading-none font-mono tracking-tight">
            {fmtHMS(displaySeconds)}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Total saved: <strong>{fmtHMS(baseSeconds)}</strong>
            {timerState.isRunning && (
              <span className="ml-2 text-green-600">● Live</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {timerState.status !== "DONE" && (
            <>
              {!timerState.isRunning ? (
                <Button
                  onClick={startTimer}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </Button>
              ) : (
                <Button
                  onClick={pauseTimer}
                  disabled={loading}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              )}
            </>
          )}

          <Button 
            onClick={stopTimer} 
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            <Square className="mr-2 h-4 w-4" />
            Stop
          </Button>
          
          <Button 
            variant="secondary" 
            onClick={resetTimer}
            disabled={loading}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          
          <Button
            onClick={addManual}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Manual
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}