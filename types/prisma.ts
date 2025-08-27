// types/prisma.ts - Local type definitions for Prisma models
export type JobStatus = "ACTIVE" | "PAUSED" | "DONE";
export type UserRole = "USER" | "ADMIN";

export interface Job {
  id: number;
  jobNumber: number | null;
  description: string | null;
  customerName: string;
  startedAt: Date | null;
  status: JobStatus;
  stoppedAt: Date | null;
  totalMs: number;
  userId: number;
}

export interface User {
  id: number;
  clerkId: string;
  email: string | null;
  name: string | null;
  role: UserRole;
}

// For compatibility with existing code that expects $Enums
export const $Enums = {
  JobStatus: {
    ACTIVE: "ACTIVE" as const,
    PAUSED: "PAUSED" as const,
    DONE: "DONE" as const,
  },
  UserRole: {
    USER: "USER" as const,
    ADMIN: "ADMIN" as const,
  },
};
