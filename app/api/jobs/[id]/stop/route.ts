import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const jobId = parseInt(params.id);

  const job = await prisma.job.findUnique({
    where: { id: jobId, userId: user.id },
  });
  if (!job?.runningSince) {
    return NextResponse.json({ error: "Job not running" }, { status: 400 });
  }

  const now = new Date();
  const durationMinutes = Math.floor(
    (now.getTime() - job.runningSince.getTime()) / 60000
  );

  // Stop timer
  await prisma.job.update({
    where: { id: jobId },
    data: { runningSince: null },
  });

  // Update time entry
  await prisma.timeEntry.updateMany({
    where: { jobId, userId: user.id, endedAt: null },
    data: { endedAt: now, duration: durationMinutes },
  });

  return NextResponse.json({ success: true });
}
