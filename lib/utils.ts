import { JobRow } from "@/app/dashboard/JobsTable";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function liveTotalMs(job: JobRow) {
  if (job.status === "ACTIVE" && job.startedAt) {
    const start = new Date(job.startedAt).getTime();
    return job.totalMs + Math.max(0, Date.now() - start);
  }
  return job.totalMs;
}
