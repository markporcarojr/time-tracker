import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
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

  const { seconds, status } = await req.json();
  const jobId = Number(params.id);

  // increment job.totalMilliseconds + set status
  const ms = Math.max(0, Number(seconds) * 1000);

  // optional: also record a TimeEntry row (manual)
  // const minutes = Math.round(ms / 60000);

  await prisma.$transaction([
    prisma.job.update({
      where: { id: jobId, userId: user.id },
      data: {
        totalMilliseconds: { increment: ms },
        status, // "ACTIVE" | "PAUSED" | "DONE"
      },
    }),
    // prisma.timeEntry.create({
    //   data: {
    //     userId: user.id,
    //     jobId,
    //     manualMinutes: minutes,
    //     startedAt: new Date(), // or null if you want "manual only"
    //     endedAt: new Date(),
    //   },
    // }),
  ]);

  return NextResponse.json({ ok: true });
}
