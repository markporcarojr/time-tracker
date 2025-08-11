import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { addDays, startOfDay, startOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  Clock, 
  Calendar, 
  Briefcase, 
  Plus, 
  TrendingUp, 
  Play, 
  CheckCircle,
  Pause 
} from "lucide-react";

type JobStatus = "ACTIVE" | "PAUSED" | "DONE";

// Utility function for future status icon rendering
function getStatusIcon(status: JobStatus) {
  switch (status) {
    case "ACTIVE":
      return Play;
    case "PAUSED":
      return Pause;
    case "DONE":
      return CheckCircle;
    default:
      return Play;
  }
}

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
    <div className="mx-auto max-w-7xl p-6 space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your time and manage your projects
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="inline-flex items-center gap-2 rounded-hard bg-primary px-6 py-3 text-primary-foreground shadow-hard hover:opacity-90 transition-opacity font-medium"
        >
          <Plus className="h-4 w-4" />
          New Job
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="shadow-plate border-border hover:shadow-hard transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Week
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold font-mono tracking-tight">
              {fmtHMS(weekSeconds)}
            </div>
            <div className="space-y-2">
              <Progress value={weekPct} className="h-2" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {weekPct}% of target
                </span>
                <span className="text-muted-foreground">40h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-plate border-border hover:shadow-hard transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold font-mono tracking-tight">
              {fmtHMS(monthSeconds)}
            </div>
            <div className="space-y-2">
              <Progress value={monthPct} className="h-2" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {monthPct}% of target
                </span>
                <span className="text-muted-foreground">160h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-plate border-border hover:shadow-hard transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Jobs Overview
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="text-xs font-medium">
                <span className="font-bold mr-1">{jobs.length}</span>
                Total
              </Badge>
              <Badge className="bg-primary text-primary-foreground text-xs font-medium">
                <Play className="h-3 w-3 mr-1" />
                <span className="font-bold mr-1">{activeJobs.length}</span>
                Active
              </Badge>
              <Badge variant="secondary" className="text-xs font-medium">
                <CheckCircle className="h-3 w-3 mr-1" />
                <span className="font-bold mr-1">{jobs.filter((j) => j.status === "DONE").length}</span>
                Done
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Active Jobs Section */}
      <Card className="shadow-plate border-border">
        <CardHeader className="border-b border-border">
          <div className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Active Jobs
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Your currently running projects
              </p>
            </div>
            <Link 
              href="/jobs" 
              className="text-sm text-primary hover:text-primary/80 underline underline-offset-4 font-medium transition-colors"
            >
              View all jobs
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {activeJobs.length === 0 ? (
            <div className="text-center py-12">
              <Pause className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-lg font-medium text-muted-foreground mb-2">
                No active jobs yet
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Start tracking time by creating your first job
              </p>
              <Link
                href="/jobs/new"
                className="inline-flex items-center gap-2 rounded-hard bg-primary px-4 py-2 text-primary-foreground shadow-hard hover:opacity-90 transition-opacity text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Create Your First Job
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {activeJobs.map((job) => {
                const savedSec = Math.floor(
                  (job.totalMilliseconds ?? 0) / 1000
                );
                return (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="group"
                  >
                    <div className={cn(
                      "rounded-hard border border-border bg-card p-6 shadow-hard hover:shadow-plate transition-all duration-200 hover:border-primary/20 group-hover:scale-[1.02]"
                    )}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                            {job.name}
                          </h3>
                          {job.description && (
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                              {job.description}
                            </p>
                          )}
                        </div>
                        <Badge className="bg-primary text-primary-foreground ml-4 flex-shrink-0">
                          <Play className="h-3 w-3 mr-1" />
                          {job.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Time logged:</span>
                        </div>
                        <div className="font-mono text-lg font-semibold">
                          {fmtHMS(savedSec)}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
