import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const jobId = parseInt(params.id);

    if (isNaN(jobId)) {
      return new NextResponse("Invalid job ID", { status: 400 });
    }

    // Check if the job exists and belongs to the user
    const existingJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        userId: user.id,
      },
    });

    if (!existingJob) {
      return new NextResponse("Job not found or not authorized", { status: 404 });
    }

    // Delete related time entries first, then delete the job
    await prisma.timeEntry.deleteMany({
      where: {
        jobId: jobId,
      },
    });

    await prisma.job.delete({
      where: {
        id: jobId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting job:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}