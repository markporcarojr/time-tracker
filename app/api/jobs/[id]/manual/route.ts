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

  if (!minutes || typeof minutes !== "number" || minutes <= 0) {
    return NextResponse.json(
      { error: "minutes must be a positive number" },
      { status: 400 }
    );
  }

  // Optional guard: don’t allow manual add if running
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
  });
  if (!job)
    return NextResponse.json({ error: "Job not found" }, { status: 404 });

  await prisma.timeEntry.create({
    data: { userId: user.id, jobId, manualMinutes: minutes },
  });

  return NextResponse.json({ ok: true });
}
