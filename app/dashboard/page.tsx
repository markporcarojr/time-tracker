import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

// ⬅️ Make sure this path matches where you put the table component I gave you
import { JobsTable, type JobRow } from "./JobsTable";

export default async function Page() {
  const { userId } = await auth();
  if (!userId) return <div className="p-6">Unauthorized</div>;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return <div className="p-6">No user</div>;

  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    orderBy: { id: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      startedAt: true,
      stoppedAt: true,
      totalMs: true,
      userId: true,
    },
  });

  // Serialize dates for the client table schema (JobRow expects ISO strings or null)
  const rows: JobRow[] = jobs.map((j) => ({
    id: j.id,
    name: j.name,
    description: j.description,
    status: j.status, // "ACTIVE" | "PAUSED" | "DONE"
    startedAt: j.startedAt ? j.startedAt.toISOString() : null,
    stoppedAt: j.stoppedAt ? j.stoppedAt.toISOString() : null,
    totalMs: j.totalMs ?? 0,
    userId: j.userId,
  }));

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Removed SectionCards + ChartAreaInteractive for now */}
              <div className="px-4 lg:px-6">
                <JobsTable data={rows} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
