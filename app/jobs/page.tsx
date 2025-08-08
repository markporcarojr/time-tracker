// app/jobs/page.tsx
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export default async function JobListPage() {
  const { userId } = await auth();
  if (!userId) return notFound();

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!user) return notFound();

  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
    },
  });

  const badgeClass = (status: "ACTIVE" | "PAUSED" | "DONE") =>
    ({
      ACTIVE: "bg-primary text-primary-foreground",
      PAUSED: "bg-muted text-foreground",
      DONE: "bg-emerald-600 text-white",
    }[status]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">🛠 Jobs</h1>
        <Button
          asChild
          className="bg-primary text-primary-foreground shadow-hard rounded-hard"
        >
          <Link href="/jobs/new">+ Add Job</Link>
        </Button>
      </div>

      {/* Empty state */}
      {jobs.length === 0 && (
        <Card className="border-border rounded-hard shadow-plate">
          <CardContent className="p-6 text-muted-foreground">
            No jobs yet. Click <span className="font-medium">+ Add Job</span> to
            get started.
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div className="grid gap-3">
        {jobs.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`} className="group">
            <Card className="border-border rounded-hard hover:shadow-plate transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-base font-semibold group-hover:underline">
                  {job.name}
                </CardTitle>
                <Badge
                  className={`rounded-hard ${badgeClass(job.status as any)}`}
                >
                  {job.status}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0">
                {job.description ? (
                  <p className="text-sm text-muted-foreground">
                    {job.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No description
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Created {new Date(job.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
