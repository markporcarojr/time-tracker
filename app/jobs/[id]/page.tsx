import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import TimerPageClient from "./TimerPageClient";

export default async function JobPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return <div>Unauthorized</div>;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return <div>No user</div>;

  const job = await prisma.job.findFirst({
    where: { id: Number(params.id), userId: user.id },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      totalMilliseconds: true,
    },
  });

  if (!job) return <div>Job not found</div>;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <TimerPageClient
        jobId={job.id}
        name={job.name}
        description={job.description ?? ""}
        savedTotalMs={job.totalMilliseconds ?? 0}
        initialStatus={job.status as "ACTIVE" | "PAUSED" | "DONE"}
      />
    </div>
  );
}
