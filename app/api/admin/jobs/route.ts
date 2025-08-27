import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if the user is an admin
    await requireAdmin();

    // Fetch all jobs with user information
    const jobs = await prisma.job.findMany({
      orderBy: { id: "desc" },
      select: {
        id: true,
        customerName: true,
        jobNumber: true,
        description: true,
        status: true,
        startedAt: true,
        stoppedAt: true,
        totalMs: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Error fetching admin jobs:", error);
    
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}