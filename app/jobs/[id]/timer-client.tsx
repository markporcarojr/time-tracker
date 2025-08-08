// app/jobs/[id]/timer-client.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function TimerClient({
  jobId,
  initialTotalMinutes,
  initialRunningSince,
}: {
  jobId: number;
  initialTotalMinutes: number;
  initialRunningSince: string | Date | null;
}) {
  const [total, setTotal] = useState(initialTotalMinutes); // committed minutes
  const [runningSince, setRunningSince] = useState<Date | null>(
    initialRunningSince ? new Date(initialRunningSince) : null
  );
  const [busy, setBusy] = useState(false);
  const tickRef = useRef<number | null>(null);

  // live total shown
  const displayMinutes = useMemo(() => {
    if (!runningSince) return total;
    const now = Date.now();
    const extra = Math.floor((now - runningSince.getTime()) / 60000);
    return total + Math.max(0, extra);
  }, [total, runningSince]);

  useEffect(() => {
    if (!runningSince) return;
    tickRef.current = window.setInterval(() => {
      // just trigger re-render
      setTotal((t) => t);
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [runningSince]);

  const start = async () => {
    if (busy || runningSince) return;
    setBusy(true);
    try {
      // optimistic
      const now = new Date();
      setRunningSince(now);

      const res = await fetch(`/api/jobs/${jobId}/start`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      // server returns runningSince if you want to sync, but optimistic is fine
    } catch (e) {
      // rollback
      setRunningSince(null);
      console.error(e);
      alert("Failed to start timer.");
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    if (busy || !runningSince) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/stop`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      // trust server total; clears running
      setTotal(data.totalMinutes);
      setRunningSince(null);
    } catch (e) {
      console.error(e);
      alert("Failed to stop timer.");
    } finally {
      setBusy(false);
    }
  };

  const hours = Math.floor(displayMinutes / 60);
  const mins = displayMinutes % 60;

  return (
    <div className="mt-6 card-surface border border-border rounded-hard shadow-plate p-6">
      <div className="text-5xl font-mono tracking-tight select-none">
        {String(hours).padStart(2, "0")}:{String(mins).padStart(2, "0")}
      </div>

      <div className="mt-4 flex gap-3">
        {!runningSince ? (
          <button
            onClick={start}
            disabled={busy}
            className="bg-primary text-primary-foreground rounded-hard px-5 py-3 shadow-hard disabled:opacity-60"
          >
            Start
          </button>
        ) : (
          <button
            onClick={stop}
            disabled={busy}
            className="bg-emerald-600 text-white rounded-hard px-5 py-3 shadow-hard disabled:opacity-60"
          >
            Stop & Save
          </button>
        )}
        <button
          onClick={async () => {
            const v = prompt("Add minutes:");
            const m = Number(v);
            if (!Number.isFinite(m) || m <= 0) return;
            setBusy(true);
            try {
              // optimistic
              if (runningSince) setRunningSince(null);
              setTotal((t) => t + m);
              const res = await fetch(`/api/jobs/${jobId}/add-minutes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ minutes: m }),
              });
              if (!res.ok) throw new Error(await res.text());
            } catch (e) {
              console.error(e);
              alert("Failed to add minutes.");
            } finally {
              setBusy(false);
            }
          }}
          className="border border-border rounded-hard px-5 py-3"
        >
          + Minutes
        </button>
      </div>
    </div>
  );
}
