import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getTimeTotals } from "@/lib/getTimeTotals";
import { SummaryCard } from "@/components/SummaryCard";

export default async function TimeTrackerPage() {
  const { userId } = await auth();
  const user = await prisma.user.findUnique({ where: { clerkId: userId! } });
  if (!user) return <div>User not found</div>;

  const totals = await getTimeTotals(user.id);

  const sessions = await prisma.timeSession.findMany({
    where: { userId: user.id },
    orderBy: { startTime: "desc" },
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">⏱️ Time Tracker</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Today" minutes={totals.day} />
        <SummaryCard label="This Week" minutes={totals.week} />
        <SummaryCard label="This Month" minutes={totals.month} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mt-6 mb-2">Recent Sessions</h2>
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id} className="text-sm border p-2 rounded">
              {s.startTime ? new Date(s.startTime).toLocaleString() : "Manual"}{" "}
              →{" "}
              {s.endTime
                ? new Date(s.endTime).toLocaleTimeString()
                : s.duration
                ? `${s.duration} mins`
                : "⏱️ In Progress"}
              {s.note && (
                <div className="text-gray-500 text-xs mt-1">Note: {s.note}</div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
