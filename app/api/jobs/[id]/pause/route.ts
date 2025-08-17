// app/api/jobs/[id]/pause/route.ts
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobId = Number(params.id);
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
  });
  if (!job)
    return NextResponse.json({ error: "Job not found" }, { status: 404 });

  if (!job.startedAt) {
    return NextResponse.json({ ok: true, message: "Already paused" }); // idempotent
  }

  const now = new Date();
  const delta = Math.max(0, now.getTime() - new Date(job.startedAt).getTime());

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: {
      startedAt: null,
      stoppedAt: now,
      totalMs: job.totalMs + delta,
      status: "PAUSED",
    },
  });

  return NextResponse.json({
    ok: true,
    totalMs: updated.totalMs,
    stoppedAt: now.toISOString(),
  });
}
