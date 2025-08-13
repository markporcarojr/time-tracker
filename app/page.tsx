// app/page.tsx
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { addDays, startOfDay, startOfMonth } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/dashboard/StatCard";
import { JobsOverviewCard } from "@/components/dashboard/JobsOverviewCard";
import { ActiveJobsList } from "@/components/dashboard/ActiveJobsList";
import { fmtHMS } from "@/lib/format";

type JobStatus = "ACTIVE" | "PAUSED" | "DONE";

const getTimeSummary = async (userId: number) => {
  const now = new Date();
  const weekStart = startOfDay(addDays(now, -7));
  const monthStart = startOfMonth(now);

  const weekResult = (await prisma.job.aggregate({
    where: {
      userId,
      status: "DONE",
      stoppedAt: { gte: weekStart },
    },
    _sum: { totalMs: true },
  })) || { _sum: { totalMs: 0 } };

  const monthResult = (await prisma.job.aggregate({
    where: {
      userId,
      status: "DONE",
      stoppedAt: { gte: monthStart },
    },
    _sum: { totalMs: true },
  })) || { _sum: { totalMs: 0 } };

  return {
    weekMinutes: Math.floor((weekResult._sum.totalMs || 0) / 60000),
    monthMinutes: Math.floor((monthResult._sum.totalMs || 0) / 60000),
  };
};
export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return <div className="p-6">Unauthorized</div>;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return <div className="p-6">No user</div>;

  const [jobs, summary] = await Promise.all([
    prisma.job.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        totalMs: true,
      },
    }),
    getTimeSummary(user.id),
  ]);

  const activeJobs = jobs.filter((j) => j.status === "ACTIVE");
  const weekSeconds = summary.weekMinutes * 60;
  const monthSeconds = summary.monthMinutes * 60;

  const weekTargetSec = 40 * 3600;
  const monthTargetSec = 160 * 3600;

  const weekPct = Math.min(
    100,
    Math.round((weekSeconds / weekTargetSec) * 100)
  );
  const monthPct = Math.min(
    100,
    Math.round((monthSeconds / monthTargetSec) * 100)
  );

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link
          href="/jobs/new"
          className="inline-flex items-center rounded-hard bg-primary px-4 py-2 text-primary-foreground shadow-hard hover:opacity-90"
        >
          + New Job
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard
          title="Total this week"
          value={fmtHMS(weekSeconds)}
          progressPct={weekPct}
          hint={`${weekPct}% of 40h target`}
        />
        <StatCard
          title="Total this month"
          value={fmtHMS(monthSeconds)}
          progressPct={monthPct}
          hint={`${monthPct}% of 160h target`}
        />
        <JobsOverviewCard
          totals={{
            all: jobs.length,
            active: activeJobs.length,
            done: jobs.filter((j) => j.status === "DONE").length,
          }}
        />
      </div>

      <Separator />
      <ActiveJobsList
        jobs={
          activeJobs.length > 0
            ? activeJobs.map((j) => ({
                ...j,
                totalMilliseconds: j.totalMs,
              }))
            : []
        }
      />
    </div>
  );
}
