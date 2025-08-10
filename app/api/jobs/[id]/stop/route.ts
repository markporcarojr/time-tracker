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
  if (!job?.runningSince)
    return NextResponse.json({ error: "Not running" }, { status: 400 });

  const now = new Date();
  const duration = Math.max(
    0,
    Math.floor((now.getTime() - new Date(job.runningSince).getTime()) / 60000)
  );

  await prisma.$transaction(async (tx: any) => {
    // Update job status and clear running timer
    await tx.job.update({ 
      where: { id: jobId }, 
      data: { 
        runningSince: null, 
        status: "PAUSED",
        totalMilliseconds: { increment: duration * 60000 }
      } 
    });
    
    // Close open time entries
    await tx.timeEntry.updateMany({
      where: {
        userId: user.id,
        jobId,
        endedAt: null,
        startedAt: { not: null },
      },
      data: { endedAt: now, duration },
    });
  });

  return NextResponse.json({ ok: true, minutes: duration });
}
