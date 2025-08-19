import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getTimeTotals } from "@/lib/getTimeTotals";
import { SummaryCard } from "@/components/SummaryCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function TimeTrackerPage() {
  const { userId } = await auth();
  const user = await prisma.user.findUnique({ where: { clerkId: userId! } });
  if (!user) return <div className="p-6">User not found</div>;

  const totals = await getTimeTotals(user.id);

  const sessions = await prisma.timeSession.findMany({
    where: { userId: user.id },
    orderBy: { startTime: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">⏱️ Time Tracker</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Today" minutes={totals.day} />
        <SummaryCard label="This Week" minutes={totals.week} />
        <SummaryCard label="This Month" minutes={totals.month} />
      </div>

      <Separator />

      <Card className="shadow-plate border-border">
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No sessions yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {sessions.map((s) => (
                <li 
                  key={s.id} 
                  className="text-sm border border-border bg-card p-3 rounded-hard shadow-hard"
                >
                  <div className="font-medium">
                    {s.startTime ? new Date(s.startTime).toLocaleString() : "Manual"}{" "}
                    →{" "}
                    {s.endTime
                      ? new Date(s.endTime).toLocaleTimeString()
                      : s.duration
                      ? `${s.duration} mins`
                      : "⏱️ In Progress"}
                  </div>
                  {s.note && (
                    <div className="text-muted-foreground text-xs mt-1">
                      Note: {s.note}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
