import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { date, duration, jobId, note } = await req.json();

  if (!date || !duration) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return new NextResponse("User not found", { status: 404 });

  await prisma.timeSession.create({
    data: {
      userId: user.id,
      jobId: jobId ?? undefined,
      duration: parseInt(duration),
      note,
      startTime: new Date(date),
    },
  });

  return NextResponse.json({ ok: true });
}
