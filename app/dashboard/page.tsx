import prisma from "@/lib/prisma";
import { Job } from "@/types/prisma";
import { auth } from "@clerk/nextjs/server";
import { toast } from "sonner";
import DashboardClient from "./DashboardClient";

// app/dashboard/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function Page() {
  let user;
  try {
    const { userId } = await auth();
    if (!userId) return <div className="p-6">Unauthorized</div>;

    user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return <div className="p-6">No user</div>;
  } catch (error) {
    return (
      <div className="p-6">
        {toast.error(error instanceof Error ? error.message : "Unknown error")}
      </div>
    );
  }

  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
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
    },
  });

  // Pass jobs directly, since JobsTable expects startedAt and stoppedAt as Date | null
  const rows: Job[] = jobs.map((j: Job) => ({
    id: j.id,
    jobNumber: j.jobNumber,
    customerName: j.customerName,
    description: j.description,
    status: j.status, // "ACTIVE" | "PAUSED" | "DONE"
    startedAt: j.startedAt,
    stoppedAt: j.stoppedAt,
    totalMs: j.totalMs ?? 0,
    userId: j.userId,
  }));

  return <DashboardClient initialJobs={rows} />;
}
