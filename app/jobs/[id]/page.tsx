// app/jobs/[id]/page.tsx
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import TimerClient from "./TimerClient";

export default async function JobPage({ params }: { params: { id: string } }) {
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
      customerName: true,
      description: true,
      totalMs: true,
      startedAt: true,
      status: true,
    },
  });

  if (!job) return <div className="p-6">Job not found</div>;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <TimerClient
        jobId={job.id}
        name={job.name}
        description={job.description}
        totalMs={job.totalMs}
        startedAtISO={job.startedAt ? job.startedAt.toISOString() : null}
        status={job.status as any}
      />
    </div>
  );
}
