import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { addDays, startOfDay, startOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type JobStatus = "ACTIVE" | "PAUSED" | "DONE";

function fmtHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

async function getTimeSummary(userDbId: number) {
  // Date ranges
  const now = new Date();
  const weekStart = startOfDay(addDays(now, -6)); // last 7 days including today
  const monthStart = startOfMonth(now);

  // Pull entries for week & month once each; compute minutes server-side
  const [weekEntries, monthEntries] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        userId: userDbId,
        OR: [
          { startedAt: { gte: weekStart } },
          { endedAt: { gte: weekStart } },
        ],
      },
      select: { startedAt: true, endedAt: true, manualMinutes: true },
    }),
    prisma.timeEntry.findMany({
      where: {
        userId: userDbId,
        OR: [
          { startedAt: { gte: monthStart } },
          { endedAt: { gte: monthStart } },
        ],
      },
      select: { startedAt: true, endedAt: true, manualMinutes: true },
    }),
  ]);

  const minutesFromEntry = (e: {
    startedAt: Date;
    endedAt: Date | null;
    manualMinutes: number | null;
  }) => {
    if (e.manualMinutes && e.manualMinutes > 0) return e.manualMinutes;
    if (e.startedAt && e.endedAt) {
      const ms = e.endedAt.getTime() - e.startedAt.getTime();
      return Math.max(0, Math.floor(ms / 60000));
    }
    return 0;
  };

  const weekMin = weekEntries.reduce((sum, e) => sum + minutesFromEntry(e), 0);
  const monthMin = monthEntries.reduce(
    (sum, e) => sum + minutesFromEntry(e),
    0
  );

  return {
    weekMinutes: weekMin,
    monthMinutes: monthMin,
  };
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return <div className="p-6">Unauthorized</div>;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return <div className="p-6">No user</div>;

  const [jobs, summary] = await Promise.all([
    prisma.job.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        totalMilliseconds: true,
      },
    }),
    getTimeSummary(user.id),
  ]);

  const activeJobs = jobs.filter((j) => j.status === "ACTIVE");
  const weekSeconds = summary.weekMinutes * 60;
  const monthSeconds = summary.monthMinutes * 60;

  // Fake targets for progress (tweak as you like)
  const weekTargetSec = 40 * 3600; // 40h/week target
  const monthTargetSec = 160 * 3600; // 160h/month target

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

      {/* Top row: Summary cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="shadow-plate border-border">
          <CardHeader>
            <CardTitle>Total this week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-mono">{fmtHMS(weekSeconds)}</div>
            <Progress value={weekPct} />
            <div className="text-xs text-muted-foreground">
              {weekPct}% of 40h target
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-plate border-border">
          <CardHeader>
            <CardTitle>Total this month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-mono">{fmtHMS(monthSeconds)}</div>
            <Progress value={monthPct} />
            <div className="text-xs text-muted-foreground">
              {monthPct}% of 160h target
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-plate border-border">
          <CardHeader>
            <CardTitle>Jobs overview</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs">
              All: {jobs.length}
            </Badge>
            <Badge className="bg-primary text-primary-foreground text-xs">
              Active: {activeJobs.length}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Done: {jobs.filter((j) => j.status === "DONE").length}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Active jobs list (clickable) */}
      <Card className="shadow-plate border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Active jobs</CardTitle>
          <Link href="/jobs" className="text-sm underline hover:opacity-80">
            View all jobs
          </Link>
        </CardHeader>
        <CardContent>
          {activeJobs.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No active jobs yet.
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {activeJobs.map((job) => {
                const savedSec = Math.floor(
                  (job.totalMilliseconds ?? 0) / 1000
                );
                return (
                  <li key={job.id}>
                    <Link
                      href={`/jobs/${job.id}`}
                      className={cn(
                        "block rounded-hard border border-border bg-card p-4 shadow-hard hover:opacity-95"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{job.name}</div>
                        <Badge className="bg-primary text-primary-foreground">
                          {job.status}
                        </Badge>
                      </div>
                      {job.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {job.description}
                        </p>
                      ) : null}
                      <div className="mt-2 text-xs text-muted-foreground">
                        Saved time:{" "}
                        <span className="font-mono">{fmtHMS(savedSec)}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
