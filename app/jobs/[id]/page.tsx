import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import TimerPageClient from "./TimerPageClient";

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { userId } = await auth();
  if (!userId) return <div className="p-6">Unauthorized</div>;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return <div className="p-6">No user</div>;

  const jobId = Number(id);
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      totalMs: true,
      startedAt: true,
    },
  });
  if (!job) return <div className="p-6">Job not found</div>;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <TimerPageClient
        description={job.description || ""}
        jobId={job.id}
        name={job.name}
        initialStatus={job.status}
        savedTotalMs={job.totalMs}
      />
    </div>
  );
}
