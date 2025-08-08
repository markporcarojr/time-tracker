import prisma from "@/lib/prisma";

export async function getTimeTotals(userId: number) {
  const now = new Date();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const sessions = await prisma.timeSession.findMany({
    where: {
      userId,
      OR: [
        { startTime: { gte: startOfMonth } },
        { endTime: { gte: startOfMonth } },
      ],
    },
  });

  const totals = { day: 0, week: 0, month: 0 };

  for (const s of sessions) {
    const duration =
      s.duration ??
      (s.startTime && s.endTime
        ? Math.floor(
            (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) /
              60000
          )
        : 0);

    const started = new Date(s.startTime ?? s.createdAt);

    if (started >= startOfMonth) totals.month += duration;
    if (started >= startOfWeek) totals.week += duration;
    if (started >= startOfDay) totals.day += duration;
  }

  return totals; // in minutes
}
