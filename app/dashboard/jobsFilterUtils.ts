import type { Job } from "@/types/prisma";
import type { StatusFilter, SortKey, SortDir } from "./JobsSearch";

export function filterAndSortJobs(
  jobs: Job[],
  query: string,
  status: StatusFilter,
  sortKey: SortKey,
  sortDir: SortDir
): Job[] {
  let list = [...jobs];

  // --- search filter ---
  if (query.trim()) {
    const lower = query.toLowerCase();
    list = list.filter(
      (j) =>
        j.customerName.toLowerCase().includes(lower) ||
        j.description?.toLowerCase().includes(lower) ||
        j.jobNumber?.toString().includes(lower)
    );
  }

  // --- status filter ---
  if (status !== "ALL") {
    list = list.filter((j) => j.status === status);
  }

  // --- sorting ---
  list.sort((a, b) => {
    if (sortKey === "customerName") {
      return sortDir === "asc"
        ? a.customerName.localeCompare(b.customerName)
        : b.customerName.localeCompare(a.customerName);
    }
    if (sortKey === "created") {
      const aTime = new Date(a.startedAt ?? 0).getTime();
      const bTime = new Date(b.startedAt ?? 0).getTime();
      return sortDir === "asc" ? aTime - bTime : bTime - aTime;
    }
    if (sortKey === "status") {
      return sortDir === "asc"
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    }
    return 0;
  });

  return list;
}
