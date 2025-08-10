"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { JobStatus } from "@prisma/client";

type Props = {
  jobId: number;
  runningSinceISO: string | null;
  totalMilliseconds: number;
  status: JobStatus;
};

export default function TimerClient({
  jobId,
  runningSinceISO,
  totalMilliseconds,
  status,
}: Props) {
  const router = useRouter();

  // Base seconds from DB - never reset on client
  const baseSeconds = useMemo(
    () => Math.floor((totalMilliseconds || 0) / 1000),
    [totalMilliseconds]
  );

  // Running state from job status
  const [running, setRunning] = useState(
    status === "ACTIVE" && !!runningSinceISO
  );
  const [liveDelta, setLiveDelta] = useState(0);

  // Update liveDelta every second if running
  useEffect(() => {
    if (!running || !runningSinceISO || status !== "ACTIVE") {
      setLiveDelta(0);
      return;
    }
    const started = new Date(runningSinceISO).getTime();
    const tick = () => setLiveDelta(Math.floor((Date.now() - started) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running, runningSinceISO, status]);

  // Computed display: base + live
  const displaySeconds = baseSeconds + (running ? liveDelta : 0);

  // Formatting helper
  const fmt = (s: number) =>
    [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");

  // Start timer (update backend)
  const start = async () => {
    await fetch(`/api/jobs/${jobId}/start`, { method: "POST" });
    setRunning(true);
    router.refresh();
  };

  // Add manual minutes (update backend)
  const addManual = async () => {
    const minutes = Number(prompt("Add manual minutes:", "15") || 0);
    if (minutes > 0) {
      await fetch(`/api/jobs/${jobId}/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes }),
      });
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-6xl font-mono">{fmt(displaySeconds)}</div>
      <div className="flex gap-3">
        {status !== "DONE" && !running && (
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={start}
          >
            ▶ Start
          </button>
        )}
        <button
          className="bg-ink text-white px-4 py-2 rounded"
          onClick={addManual}
        >
          + Manual
        </button>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">
        Accumulated time is never reset until the job is closed.
      </div>
    </div>
  );
}
