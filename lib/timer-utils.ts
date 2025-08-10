// lib/timer-utils.ts
// import { JobStatus } from "@prisma/client";

// Temporary type definition until Prisma client is regenerated
type JobStatus = "ACTIVE" | "PAUSED" | "DONE" | "MANUAL";

export function isValidStatusTransition(
  from: JobStatus,
  to: JobStatus
): boolean {
  // Valid transitions:
  // ACTIVE -> PAUSED, DONE
  // PAUSED -> ACTIVE, DONE  
  // DONE -> PAUSED (to restart)
  // MANUAL can transition to any status
  // Any status can transition to MANUAL

  if (from === to) return true;

  switch (from) {
    case "ACTIVE":
      return to === "PAUSED" || to === "DONE" || to === "MANUAL";
    case "PAUSED":
      return to === "ACTIVE" || to === "DONE" || to === "MANUAL";
    case "DONE":
      return to === "PAUSED" || to === "MANUAL";
    case "MANUAL":
      return true; // MANUAL can transition to any status
    default:
      return false;
  }
}

export function shouldCloseRunningTimer(status: JobStatus): boolean {
  return status === "PAUSED" || status === "DONE";
}

export function shouldStartTimer(status: JobStatus): boolean {
  return status === "ACTIVE";
}