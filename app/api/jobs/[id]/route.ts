// app/api/jobs/[id]/route.ts
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET already existed in your project. Keeping it for completeness.
export async function GET(
  _: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await ctx.params; // Next 15: await params
  const jobId = Number(params.id);

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
    select: {
      id: true,
      customerName: true,
      jobNumber: true,
      description: true,
      status: true,
      totalMs: true,
      startedAt: true,
      stoppedAt: true,
    },
  });
  if (!job)
    return NextResponse.json({ error: "Job not found" }, { status: 404 });

  return NextResponse.json({ job });
}

type PatchBody = {
  name?: string;
  description?: string;
  addMinutes?: number;
  resetTotal?: boolean;
  status?: "ACTIVE" | "PAUSED" | "DONE";
};

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await ctx.params; // Next 15: await params
  const jobId = Number(params.id);

  const body = (await req.json()) as PatchBody;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
  });
  if (!job)
    return NextResponse.json({ error: "Job not found" }, { status: 404 });

  // Start composing the update
  const data: any = {};
  const now = new Date();

  // Name / description
  if (typeof body.name === "string") data.name = body.name;
  if (body.description !== undefined) data.description = body.description;

  // Manual minutes
  let totalMs = job.totalMs;
  if (typeof body.addMinutes === "number" && body.addMinutes > 0) {
    totalMs += body.addMinutes * 60_000;
  }

  // Reset total
  if (body.resetTotal) {
    totalMs = 0;
    data.startedAt = null;
    data.stoppedAt = now;
    data.status = "PAUSED";
  }

  // Status logic (ACTIVE/PAUSED/DONE)
  if (body.status && ["ACTIVE", "PAUSED", "DONE"].includes(body.status)) {
    // If we're switching away from ACTIVE while running, accumulate first
    if (job.startedAt && body.status !== "ACTIVE") {
      const delta = Math.max(
        0,
        now.getTime() - new Date(job.startedAt).getTime()
      );
      totalMs += delta;
      data.startedAt = null;
      data.stoppedAt = now;
    }

    // If switching to ACTIVE and not currently running, start now
    if (body.status === "ACTIVE" && !job.startedAt) {
      data.startedAt = now;
      data.stoppedAt = null;
    }

    data.status = body.status;
  }

  data.totalMs = totalMs;

  const updated = await prisma.job.update({ where: { id: jobId }, data });
  return NextResponse.json({ ok: true, job: updated });
}

export async function DELETE(
  _: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = await ctx.params;
  const jobId = Number(params.id);

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.job.delete({ where: { id: jobId, userId: user.id } });
  return NextResponse.json({ ok: true });
}
