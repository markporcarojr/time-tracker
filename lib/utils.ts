import { Job } from "@prisma/client";
import { clsx, type ClassValue } from "clsx";
import React from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function liveTotalMs(job: Job) {
  if (job.status === "ACTIVE" && job.startedAt) {
    const start = new Date(job.startedAt).getTime();
    return job.totalMs + Math.max(0, Date.now() - start);
  }
  return job.totalMs;
}

// lib/format.ts
export function fmtHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function TotalCell({ job }: { job: Job }) {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    if (job.status !== "ACTIVE" || !job.startedAt) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [job.status, job.startedAt]);
  return liveTotalMs(job);
}
