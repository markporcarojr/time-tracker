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

  // Prevent double start
  const job = await prisma.job.findUnique({
    where: { id: jobId, userId: user.id },
  });
  if (!job || job.runningSince) {
    return NextResponse.json(
      { error: "Job already running or not found" },
      { status: 400 }
    );
  }

  await prisma.job.update({
    where: { id: jobId },
    data: { runningSince: new Date() },
  });

  // Optionally create a time entry
  await prisma.timeEntry.create({
    data: { jobId, userId: user.id, startedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
