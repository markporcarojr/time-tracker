// app/api/jobs/[id]/status/route.ts
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

  const { status } = await req.json(); // "ACTIVE" | "PAUSED" | "DONE"
  if (!["ACTIVE", "PAUSED", "DONE"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const jobId = Number(params.id);
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  // If setting to DONE while running, also pause & accumulate.
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
  });
  if (!job)
    return NextResponse.json({ error: "Job not found" }, { status: 404 });

  let data: any = { status };

  if (status !== "ACTIVE" && job.startedAt) {
    const now = new Date();
    const delta = Math.max(
      0,
      now.getTime() - new Date(job.startedAt).getTime()
    );
    data = {
      ...data,
      startedAt: null,
      stoppedAt: now,
      totalMs: job.totalMs + delta,
    };
  }

  if (status === "ACTIVE" && !job.startedAt) {
    data.startedAt = new Date();
  }

  const updated = await prisma.job.update({ where: { id: jobId }, data });
  return NextResponse.json({ ok: true, job: updated });
}
