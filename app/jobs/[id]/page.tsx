// app/jobs/[id]/page.tsx (server shell + client timer)
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import TimerClient from "./timer-client";

type Params = { id: string };

export default async function JobPage({ params }: { params: Promise<Params> }) {
  const { userId } = await auth();
  if (!userId) return notFound();

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!user) return notFound();

  const { id } = await params;
  const jobId = Number(id);

  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      totalMinutes: true,
      runningSince: true,
    },
  });
  if (!job) return notFound();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{job.name}</h1>
      {job.description ? (
        <p className="text-muted-foreground">{job.description}</p>
      ) : null}

      <TimerClient
        jobId={job.id}
        initialTotalMinutes={job.totalMinutes}
        initialRunningSince={job.runningSince}
      />
    </div>
  );
}
