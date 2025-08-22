import { JobRow } from "@/app/dashboard/JobsTable";
import { clsx, type ClassValue } from "clsx";
import React from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function liveTotalMs(job: JobRow) {
  if (job.status === "ACTIVE" && job.startedAt) {
    const start = new Date(job.startedAt).getTime();
    return job.totalMs + Math.max(0, Date.now() - start);
  }
  return job.totalMs;
}

export function TotalCell({ job }: { job: JobRow }) {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    if (job.status !== "ACTIVE" || !job.startedAt) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [job.status, job.startedAt]);
  return liveTotalMs(job);
}
