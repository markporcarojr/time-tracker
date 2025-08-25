// lib/summary.ts
import prisma from "@/lib/prisma";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

/**
 * Sum overlapped minutes for entries that intersect [rangeStart, rangeEnd).
 */
function sumOverlappedMinutes(
  entries: { startedAt: Date; endedAt: Date | null }[],
  rangeStart: Date,
  rangeEnd: Date
) {
  const endNow = new Date();
  let total = 0;

  for (const e of entries) {
    const start = e.startedAt;
    const end = e.endedAt ?? endNow;

    // clip to range
    const clippedStart = start < rangeStart ? rangeStart : start;
    const clippedEnd = end > rangeEnd ? rangeEnd : end;

    const ms = clippedEnd.getTime() - clippedStart.getTime();
    if (ms > 0) total += Math.floor(ms / 60000);
  }
  return total;
}

export async function getDashboardSummary(userDbId: number) {
  const now = new Date();
  // NOTE: weekStartsOn: 1 => Monday as start-of-week. Change to 0 for Sunday if you prefer.
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Jobs for status/running
  const jobs = await prisma.job.findMany({
    where: { userId: userDbId },
    select: { status: true, runningSince: true },
  });

  const activeJobs = jobs.filter((j: typeof jobs[0]) => j.status === "ACTIVE").length;
  const runningJobs = jobs.filter((j: typeof jobs[0]) => !!j.runningSince).length;

  // Entries overlapping THIS WEEK
  const weekEntries = await prisma.timeEntry.findMany({
    where: {
      userId: userDbId,
      AND: [
        { startedAt: { lt: weekEnd } }, // started before the end of the range
        { OR: [{ endedAt: { gte: weekStart } }, { endedAt: null }] }, // ended after start (or still running)
      ],
    },
    select: { startedAt: true, endedAt: true },
  });

  // Entries overlapping THIS MONTH
  const monthEntries = await prisma.timeEntry.findMany({
    where: {
      userId: userDbId,
      AND: [
        { startedAt: { lt: monthEnd } },
        { OR: [{ endedAt: { gte: monthStart } }, { endedAt: null }] },
      ],
    },
    select: { startedAt: true, endedAt: true },
  });

  const weekMinutes = sumOverlappedMinutes(weekEntries, weekStart, weekEnd);
  const monthMinutes = sumOverlappedMinutes(monthEntries, monthStart, monthEnd);

  return {
    activeJobs,
    runningJobs,
    weekMinutes,
    monthMinutes,
  };
}

/** tiny helper for displaying minutes as "HHh MMm" */
export function fmtHM(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}
