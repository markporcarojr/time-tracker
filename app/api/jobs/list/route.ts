import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return new NextResponse("User not found", { status: 404 });

  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    select: { id: true, customerName: true },
    orderBy: { customerName: "asc" },
  });

  return NextResponse.json(jobs);
}
