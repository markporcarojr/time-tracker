// app/jobs/[id]/page.tsx
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { JobStatus } from "@prisma/client";
import TimerClient from "./TimerClient";

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return <div className="p-6">Unauthorized</div>;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return <div className="p-6">No user</div>;

  const { id } = await params;
  const jobId = Number(id);
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
    select: {
      id: true,
      jobNumber: true,
      customerName: true,
      description: true,
      totalMs: true,
      startedAt: true,
      status: true,
      stoppedAt: true,
      userId: true,
    },
  });

  if (!job) return <div className="p-6">Job not found</div>;

  return (
    <div className="p-6">
      <TimerClient
        jobNumber={job.jobNumber || 0}
        id={job.id}
        customerName={job.customerName}
        description={job.description}
        totalMs={job.totalMs}
        startedAt={job.startedAt}
        stoppedAt={job.stoppedAt}
        status={job.status as JobStatus}
        userId={job.userId}
      />
    </div>
  );
}
