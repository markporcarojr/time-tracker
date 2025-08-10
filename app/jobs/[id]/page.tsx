import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import EnhancedTimerClient from "./enhanced-timer-client";

export default async function JobPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return <div>Unauthorized</div>;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return <div>No user</div>;

  const job = await prisma.job.findFirst({
    where: { id: Number(params.id), userId: user.id },
    include: {
      timeEntries: {
        where: { endedAt: null, startedAt: { not: null } },
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!job) return <div>Job not found</div>;

  // Prepare initial timer state
  const initialState = {
    id: job.id,
    name: job.name,
    description: job.description,
    status: job.status,
    totalMilliseconds: job.totalMilliseconds,
    runningSince: job.runningSince?.toISOString() || null,
    isRunning: job.status === "ACTIVE" && !!job.runningSince,
    activeTimeEntry: job.timeEntries[0] || null,
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <EnhancedTimerClient
        jobId={job.id}
        initialState={initialState}
      />
    </div>
  );
}
