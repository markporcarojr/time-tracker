import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Job } from "@/types/prisma";
import { toast } from "sonner";
// app/dashboard/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// For now, we'll create a simple layout without the missing components
import { JobsTable } from "./JobsTable";

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
  const rows: Job[] = jobs.map((j) => ({
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

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <JobsTable data={rows} />
    </div>
  );
}
