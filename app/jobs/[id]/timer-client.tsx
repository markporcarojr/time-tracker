// app/jobs/[id]/timer-client.tsx
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

  // baseSeconds = accumulated total from DB (doesn't change on client)
  const baseSeconds = useMemo(
    () => Math.floor((totalMilliseconds || 0) / 1000),
    [totalMilliseconds]
  );

  // whether we’re running now
  const [running, setRunning] = useState(
    status === "ACTIVE" && !!runningSinceISO
  );
  // live delta seconds since running started
  const [liveDelta, setLiveDelta] = useState(0);

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

  // displaySeconds = base + live delta while running
  const displaySeconds = baseSeconds + (running ? liveDelta : 0);

  const fmt = (s: number) =>
    [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");

  const start = async () => {
    await fetch(`/api/jobs/${jobId}/start`, { method: "POST" });
    setRunning(true);
    router.refresh();
  };

  const stop = async () => {
    await fetch(`/api/jobs/${jobId}/stop`, { method: "POST" });
    setRunning(false);
    router.refresh();
  };

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
        {status !== "DONE" &&
          (running ? (
            <button
              className="bg-red-600 text-white px-4 py-2 rounded"
              onClick={stop}
            >
              ■ Pause
            </button>
          ) : (
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={start}
            >
              ▶ Start
            </button>
          ))}
        <button
          className="bg-ink text-white px-4 py-2 rounded"
          onClick={addManual}
        >
          + Manual
        </button>
      </div>
    </div>
  );
}
