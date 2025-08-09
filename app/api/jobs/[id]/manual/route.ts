// POST /api/jobs/[id]/manual
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

  const jobId = Number(params.id);
  const { minutes } = await req.json();
  const mins = Number(minutes) || 0;
  if (mins <= 0)
    return NextResponse.json({ error: "Invalid minutes" }, { status: 400 });

  const ms = mins * 60_000;
  const now = new Date();
  const start = new Date(now.getTime() - ms);

  await prisma.$transaction([
    prisma.job.update({
      where: { id: jobId },
      data: { totalMilliseconds: { increment: ms } },
    }),
    prisma.timeEntry.create({
      data: {
        userId: user.id,
        jobId,
        startedAt: start,
        endedAt: now,
        manualMinutes: mins,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
