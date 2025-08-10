// lib/types.ts
// Temporary types until Prisma client is properly generated

export type JobStatus = "ACTIVE" | "PAUSED" | "DONE" | "MANUAL";

export interface Job {
  id: number;
  name: string;
  description: string | null;
  status: JobStatus;
  totalMilliseconds: number;
  runningSince: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
}

export interface TimeEntry {
  id: number;
  startedAt: Date | null;
  endedAt: Date | null;
  duration: number | null;
  manualMinutes: number | null;
  jobId: number;
  userId: number;
}

export interface User {
  id: number;
  clerkId: string;
  email: string | null;
  name: string | null;
  createdAt: Date;
}