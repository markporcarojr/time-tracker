// app/jobs/[id]/timer-local.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function TimerLocal({ jobId }: { jobId: number }) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const tickRef = useRef<number | null>(null);

  // run/pause logic
  useEffect(() => {
    if (!isRunning) {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    const start = Date.now();
    tickRef.current = window.setInterval(() => {
      const delta = Math.floor((Date.now() - start) / 1000);
      setElapsedSec((prev) => prev + delta);
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [isRunning]);

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const reset = () => {
    setIsRunning(false);
    setElapsedSec(0);
  };

  const save = async () => {
    if (elapsedSec <= 0) return;
    const res = await fetch(`/api/jobs/${jobId}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seconds: elapsedSec }),
    });
    if (!res.ok) {
      const txt = await res.text();
      alert(`Failed to save: ${txt}`);
      return;
    }
    reset();
    router.refresh();
  };

  const fmt = (s: number) =>
    [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");

  return (
    <div className="space-y-6">
      <div className="text-6xl font-mono select-none">{fmt(elapsedSec)}</div>

      <div className="flex gap-3">
        {!isRunning ? (
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={start}
          >
            ▶ Start
          </button>
        ) : (
          <button
            className="bg-red-600 text-white px-4 py-2 rounded"
            onClick={pause}
          >
            ❚❚ Pause
          </button>
        )}

        <button
          className="bg-ink text-white px-4 py-2 rounded"
          onClick={reset}
          disabled={elapsedSec === 0}
        >
          ↺ Reset
        </button>

        <button
          className="bg-primary text-white px-4 py-2 rounded shadow-hard"
          onClick={save}
          disabled={elapsedSec === 0}
        >
          💾 Save
        </button>
      </div>
    </div>
  );
}
