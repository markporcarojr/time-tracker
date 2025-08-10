import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { JobStatus } from "@/lib/types";
import { isValidStatusTransition, shouldCloseRunningTimer, shouldStartTimer } from "@/lib/timer-utils";

export async function GET(
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

  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
    include: {
      timeEntries: {
        where: { endedAt: null, startedAt: { not: null } },
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    name: job.name,
    description: job.description,
    status: job.status,
    totalMilliseconds: job.totalMilliseconds,
    runningSince: job.runningSince,
    isRunning: job.status === "ACTIVE" && !!job.runningSince,
    activeTimeEntry: job.timeEntries[0] || null,
  });
}

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

  const { action, status, minutes } = await req.json();
  const jobId = Number(params.id);

  // Get current job state
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
  });
  
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const newStatus = status as JobStatus;
  
  // Validate status transition
  if (!isValidStatusTransition(job.status, newStatus)) {
    return NextResponse.json(
      { error: `Invalid status transition from ${job.status} to ${newStatus}` },
      { status: 400 }
    );
  }

  const now = new Date();

  try {
    await prisma.$transaction(async (tx: any) => {
      // Handle different actions
      switch (action) {
        case "start":
          // Ensure only one ACTIVE session per user
          if (newStatus === "ACTIVE") {
            await tx.job.updateMany({
              where: { userId: user.id, status: "ACTIVE", id: { not: jobId } },
              data: { status: "PAUSED", runningSince: null },
            });
            
            // Close any open time entries for other jobs
            await tx.timeEntry.updateMany({
              where: { 
                userId: user.id, 
                endedAt: null, 
                startedAt: { not: null },
                jobId: { not: jobId }
              },
              data: { endedAt: now },
            });
          }

          // Start timer for this job
          await tx.job.update({
            where: { id: jobId },
            data: { 
              status: newStatus, 
              runningSince: shouldStartTimer(newStatus) ? now : null 
            },
          });

          // Create new time entry if starting timer
          if (shouldStartTimer(newStatus)) {
            await tx.timeEntry.create({
              data: { userId: user.id, jobId, startedAt: now },
            });
          }
          break;

        case "stop":
        case "pause":
          // Stop/pause current timer
          const runningJob = await tx.job.findFirst({
            where: { id: jobId, userId: user.id },
          });

          if (runningJob?.runningSince && shouldCloseRunningTimer(newStatus)) {
            const duration = Math.max(0, Math.floor((now.getTime() - new Date(runningJob.runningSince).getTime()) / 60000));
            
            // Close open time entries
            await tx.timeEntry.updateMany({
              where: {
                userId: user.id,
                jobId,
                endedAt: null,
                startedAt: { not: null },
              },
              data: { endedAt: now, duration },
            });

            // Update job
            await tx.job.update({
              where: { id: jobId },
              data: { 
                status: newStatus, 
                runningSince: null,
                totalMilliseconds: { increment: duration * 60000 }
              },
            });
          } else {
            // Just update status
            await tx.job.update({
              where: { id: jobId },
              data: { status: newStatus },
            });
          }
          break;

        case "manual":
          const manualMinutes = Number(minutes) || 0;
          if (manualMinutes <= 0) {
            throw new Error("Invalid manual minutes");
          }

          const ms = manualMinutes * 60000;
          
          await tx.job.update({
            where: { id: jobId },
            data: { 
              status: "MANUAL",
              totalMilliseconds: { increment: ms }
            },
          });

          await tx.timeEntry.create({
            data: {
              userId: user.id,
              jobId,
              manualMinutes,
              startedAt: new Date(now.getTime() - ms),
              endedAt: now,
              duration: manualMinutes,
            },
          });
          break;

        default:
          throw new Error("Invalid action");
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Session API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
