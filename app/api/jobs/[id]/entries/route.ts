// app/api/jobs/[id]/entries/route.ts
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return new NextResponse("User not found", { status: 404 });

  const jobId = Number(params.id);
  const { seconds } = await req.json().catch(() => ({} as any));
  const secs = Number(seconds) || 0;
  if (jobId <= 0 || secs <= 0)
    return new NextResponse("Bad request", { status: 400 });

  const now = new Date();
  const start = new Date(now.getTime() - secs * 1000);

  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
  });
  if (!job) return new NextResponse("Job not found", { status: 404 });

  await prisma.$transaction([
    prisma.timeEntry.create({
      data: { userId: user.id, jobId, startedAt: start, endedAt: now },
    }),
    prisma.job.update({
      where: { id: jobId },
      data: { totalMilliseconds: { increment: secs * 1000 } },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
