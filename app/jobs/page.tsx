import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import JobListClient from "./job-list-client";

export default async function JobListPage() {
  const { userId } = await auth();
  if (!userId) return <div className="p-6">Unauthorized</div>;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return <div className="p-6">No user</div>;

  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      jobNumber: true,
      customerName: true,
      description: true,
      status: true,
      totalMs: true,
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

      <JobListClient initialJobs={jobs} />
    </div>
  );
}
