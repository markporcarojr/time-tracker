// app/page.tsx
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getDashboardSummary, fmtHM } from "@/lib/summary";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return notFound();

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!user) return notFound();

  const summary = await getDashboardSummary(user.id);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">📊 Dashboard</h1>
        <div className="flex gap-2">
          <Button
            asChild
            className="rounded-hard bg-primary text-primary-foreground shadow-hard"
          >
            <Link href="/jobs/new">+ New Job</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-hard">
            <Link href="/jobs">View Jobs</Link>
          </Button>
        </div>
      </div>

      {/* Widgets */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-hard shadow-plate">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Active Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.activeJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Jobs currently marked ACTIVE
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-hard shadow-plate">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Currently Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.runningJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Jobs with a running timer
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-hard shadow-plate">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Hours this Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {fmtHM(summary.weekMinutes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on session overlap with this week
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-hard shadow-plate">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Hours this Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {fmtHM(summary.monthMinutes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on session overlap with this month
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-2" />

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        <Button asChild className="rounded-hard">
          <Link href="/jobs">Manage Jobs</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-hard">
          <Link href="/jobs?filter=running">See Running</Link>
        </Button>
      </div>
    </div>
  );
}
