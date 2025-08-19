import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return new NextResponse("User not found", { status: 404 });

  const { customerName, description, status, jobNumber } = await req.json();

  const job = await prisma.job.create({
    data: {
      userId: user.id,
      jobNumber,
      customerName,
      description,
      status: status ?? "ACTIVE",
    },
    select: { id: true },
  });

  return NextResponse.json(job);
}
