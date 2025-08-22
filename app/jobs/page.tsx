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
      customerName: true,
      jobNumber: true,
      description: true,
      status: true,
      startedAt: true,
      stoppedAt: true,
      totalMs: true,
      userId: true,
    },
  });

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <JobListClient initialJobs={jobs} />
    </div>
  );
}
