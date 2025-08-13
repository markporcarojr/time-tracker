import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });

  const jobId = Number(params.id);
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
  });
  if (!job)
    return NextResponse.json({ error: "Job not found" }, { status: 404 });

  if (!job.startedAt) return NextResponse.json({ ok: true }); // already stopped

  const now = new Date();
  const ms = Math.max(0, now.getTime() - job.startedAt.getTime());

  await prisma.job.update({
    where: { id: jobId },
    data: {
      totalMs: { increment: ms },
      startedAt: null,
      stoppedAt: now,
      status: "PAUSED",
    },
  });

  return NextResponse.json({ ok: true, addedMs: ms });
}
