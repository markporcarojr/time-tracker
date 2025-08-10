import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const jobId = Number(params.id);

  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
  });
  if (!job)
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (job.runningSince)
    return NextResponse.json({ error: "Already running" }, { status: 400 });

  const now = new Date();

  await prisma.$transaction(async (tx: any) => {
    // Ensure only one ACTIVE session per user
    await tx.job.updateMany({
      where: { userId: user.id, status: "ACTIVE", id: { not: jobId } },
      data: { status: "PAUSED", runningSince: null },
    });
    
    // Close any open time entries for other jobs
    await tx.timeEntry.updateMany({
      where: { 
        userId: user.id, 
        endedAt: null, 
        startedAt: { not: null },
        jobId: { not: jobId }
      },
      data: { endedAt: now },
    });

    // Close any dangling open entries for this job
    await tx.timeEntry.updateMany({
      where: { userId: user.id, jobId, endedAt: null, startedAt: { not: null } },
      data: { endedAt: now },
    });

    // Start timer for this job
    await tx.job.update({
      where: { id: jobId },
      data: { runningSince: now, status: "ACTIVE" },
    });
    
    await tx.timeEntry.create({
      data: { userId: user.id, jobId, startedAt: now },
    });
  });

  return NextResponse.json({ ok: true });
}
