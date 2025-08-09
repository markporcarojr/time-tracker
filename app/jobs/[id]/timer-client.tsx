"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TimerClient({
  jobId,
  runningSinceISO,
}: {
  jobId: number;
  runningSinceISO: string | null;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(!!runningSinceISO);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running || !runningSinceISO) return;
    const startMs = new Date(runningSinceISO).getTime();

    const tick = () => setElapsed(Math.floor((Date.now() - startMs) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running, runningSinceISO]);

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

  const fmt = (s: number) =>
    [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");

  return (
    <div className="space-y-6">
      <div className="text-6xl font-mono">
        {running ? fmt(elapsed) : "00:00:00"}
      </div>
      <div className="flex gap-3">
        {!running ? (
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={start}
          >
            ▶ Start
          </button>
        ) : (
          <button
            className="bg-red-600 text-white px-4 py-2 rounded"
            onClick={stop}
          >
            ■ Stop
          </button>
        )}
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
