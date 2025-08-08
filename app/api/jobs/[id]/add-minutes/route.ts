// app/api/jobs/[id]/add-minutes/route.ts
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const jobId = Number(id);
  const { minutes } = await req.json();

  if (!Number.isFinite(minutes) || minutes <= 0) {
    return new NextResponse("Invalid minutes", { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!user) return new NextResponse("User not found", { status: 404 });

  await prisma.$transaction(async (tx) => {
    // (Optional) also create a TimeEntry row for history
    await tx.timeEntry.create({
      data: {
        userId: user.id,
        jobId,
        startedAt: new Date(Date.now() - minutes * 60000),
        endedAt: new Date(),
        manualMinutes: minutes,
      },
    });

    await tx.job.update({
      where: { id: jobId, userId: user.id },
      data: { totalMinutes: { increment: minutes } },
    });
  });

  return NextResponse.json({ ok: true });
}
