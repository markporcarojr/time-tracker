// app/page.tsx
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { convertToHours } from "@/lib/msToHours";

function fmtHMS(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return <div className="p-6">Unauthorized</div>;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return <div className="p-6">No user</div>;

  const now = Date.now();

  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    orderBy: { id: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      totalMs: true,
      startedAt: true,
    },
  });

  const active = jobs.filter((j) => j.status === "ACTIVE");
  const totalLiveMs = jobs.reduce((sum, j) => {
    const live = j.totalMs + (j.startedAt ? now - j.startedAt.getTime() : 0);
    return sum + live;
  }, 0);

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

      {/* Simple stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="shadow-plate border-border">
          <CardHeader>
            <CardTitle>Running jobs</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-mono">
            {active.length}
          </CardContent>
        </Card>

        <Card className="shadow-plate border-border">
          <CardHeader>
            <CardTitle>Total time (all)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-mono">
            {fmtHMS(Math.floor(totalLiveMs / 1000))}
          </CardContent>
        </Card>

        <Card className="shadow-plate border-border">
          <CardHeader>
            <CardTitle>All jobs</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-mono">
            {jobs.length}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Active jobs */}
      <Card className="shadow-plate border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Active jobs</CardTitle>
          <Link href="/jobs" className="text-sm underline hover:opacity-80">
            View all jobs
          </Link>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No active jobs yet.
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {active.map((j) => {
                const liveMs =
                  j.totalMs + (j.startedAt ? now - j.startedAt.getTime() : 0);
                return (
                  <li key={j.id}>
                    <Link
                      href={`/jobs/${j.id}`}
                      className="block rounded-hard border border-border bg-card p-4 shadow-hard hover:opacity-95"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{j.name}</div>
                        <Badge className="bg-primary text-primary-foreground">
                          {j.status}
                        </Badge>
                        <Badge variant="outline">
                          {convertToHours(j.totalMs) || 0}
                        </Badge>
                      </div>
                      {j.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {j.description}
                        </p>
                      ) : null}
                      <div className="mt-2 text-xs text-muted-foreground">
                        Live time:{" "}
                        <span className="font-mono">
                          {fmtHMS(Math.floor(liveMs / 1000))}
                        </span>
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
