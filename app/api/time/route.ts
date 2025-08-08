// app/api/time/start/route.ts
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { startTime, jobId } = body as {
      startTime?: string | number | Date;
      jobId?: number | null;
    };

    // Validate/normalize start time (default: now)
    const startedAt = startTime ? new Date(startTime) : new Date();
    if (Number.isNaN(startedAt.getTime())) {
      return new NextResponse("Invalid startTime", { status: 400 });
    }

    // Find user row by Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkId },
      select: { id: true },
    });
    if (!user) return new NextResponse("User not found", { status: 404 });

    // Close any open entry (endedAt is null)
    await prisma.timeEntry.updateMany({
      where: { userId: user.id, endedAt: null },
      data: { endedAt: new Date() },
    });

    // Start new entry
    const entry = await prisma.timeEntry.create({
      data: {
        userId: user.id,
        jobId: jobId ?? null, // optional
        startedAt,
        // endedAt stays null while running
      },
      select: { id: true, startedAt: true, jobId: true },
    });

    return NextResponse.json({ ok: true, entry });
  } catch (err: any) {
    console.error("[/api/time/start] error:", err?.message || err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
