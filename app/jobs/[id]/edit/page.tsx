// app/jobs/[id]/edit/page.tsx
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import EditJobForm from "./EditJobForm";

export default async function EditJobPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();
  if (!userId) return <div className="p-6">Unauthorized</div>;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return <div className="p-6">No user</div>;

  const id = Number(params.id);
  const job = await prisma.job.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      customerName: true,
      description: true,
      status: true,
      totalMs: true,
      startedAt: true,
      jobNumber: true,
      stoppedAt: true,
      userId: true,
    },
  });
  if (!job) return <div className="p-6">Job not found</div>;

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <EditJobForm job={job} />
    </div>
  );
}
