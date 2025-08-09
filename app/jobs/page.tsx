import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function JobListPage() {
  const { userId } = await auth();
  if (!userId) return <div className="p-6">Unauthorized</div>;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return <div className="p-6">No user</div>;

  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      totalMilliseconds: true,
    },
  });

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <Link
          href="/jobs/new"
          className="inline-flex items-center rounded-hard bg-primary px-4 py-2 text-primary-foreground shadow-hard hover:opacity-90"
        >
          + Add Job
        </Link>
      </div>

      <Card className="shadow-plate border-border">
        <CardHeader>
          <CardTitle>All jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="block rounded-hard border border-border bg-card p-4 shadow-hard hover:opacity-95"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{job.name}</div>
                    <Badge variant="secondary">{job.status}</Badge>
                  </div>
                  {job.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {job.description}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
