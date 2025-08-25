// lib/hours.ts
import prisma from "@/lib/prisma";
import { startOfWeek, startOfMonth } from "date-fns";
import { auth } from "@clerk/nextjs/server";

// Sums minutes for entries intersecting [from, now]
async function sumMinutes(from: Date, userId: number) {
  const now = new Date();

  // Pull entries that might overlap the window
  const entries = await prisma.timeEntry.findMany({
    where: {
      userId,
      OR: [{ startedAt: { gte: from } }, { endedAt: { gte: from } }],
    },
    select: { startedAt: true, endedAt: true, manualMinutes: true },
  });

  let total = 0;
  for (const e of entries) {
    if (e.manualMinutes != null) {
      total += e.manualMinutes;
      continue;
    }
    const start = e.startedAt < from ? from : e.startedAt;
    const end = e.endedAt ?? now;
    if (end > start) {
      total += Math.floor((end.getTime() - start.getTime()) / 60000);
    }
  }
  return total;
}

export async function getHoursForUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return null;

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const monthStart = startOfMonth(new Date());

  const [weekMin, monthMin, totalJobs, activeJobs] = await Promise.all([
    sumMinutes(weekStart, user.id),
    sumMinutes(monthStart, user.id),
    prisma.job.count({ where: { userId: user.id } }),
    prisma.job.count({ where: { userId: user.id, status: "ACTIVE" } }),
  ]);

  return {
    weekHours: +(weekMin / 60).toFixed(2),
    monthHours: +(monthMin / 60).toFixed(2),
    totalJobs,
    activeJobs,
  };
}
