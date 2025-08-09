import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import TimerClient from "./timer-client";

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

export default async function JobPage(props: { params: { id: string } }) {
  const params = await props.params;

  const { userId } = await auth();
  if (!userId) return <div>Unauthorized</div>;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return <div>No user</div>;

  const jobId = Number(params.id);
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
    select: {
      id: true,
      name: true,
      runningSince: true,
      totalMilliseconds: true,
    }, // <-- needs column
  });
  if (!job) return <div>Job not found</div>;

  // Compute total = saved total + (currently running delta)
  let total = job.totalMilliseconds ?? 0;
  if (job.runningSince) {
    total += Date.now() - job.runningSince.getTime();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{job.name}</h1>

      <p className="text-lg font-medium">Total: {formatDuration(total)}</p>

      <TimerClient
        jobId={job.id}
        runningSinceISO={
          job.runningSince ? job.runningSince.toISOString() : null
        }
        // If you want the client to live-update the "Total" text later,
        // you can also pass total as a prop and tick it. For now, server-rendered is fine.
      />
    </div>
  );
}
