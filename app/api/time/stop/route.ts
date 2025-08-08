import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return new NextResponse("User not found", { status: 404 });

  const session = await prisma.timeSession.findFirst({
    where: { userId: user.id, endTime: null },
    orderBy: { startTime: "desc" },
  });

  if (!session) return new NextResponse("No active session", { status: 400 });

  await prisma.timeSession.update({
    where: { id: session.id },
    data: { endTime: new Date() },
  });

  return NextResponse.json({ ok: true });
}
