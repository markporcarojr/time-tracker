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

  // filter by status
  if (status !== "ALL") {
    list = list.filter((j) => j.status === status);
  }

  // filter by search query
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    list = list.filter(
      (j) =>
        j.customerName.toLowerCase().includes(q) ||
        (j.description?.toLowerCase().includes(q) ?? false) ||
        (j.jobNumber !== null && j.jobNumber.toString().includes(q))
    );
  }

  // sort
  list.sort((a, b) => {
    let res = 0;
    if (sortKey === "customerName") {
      res = a.customerName.localeCompare(b.customerName);
    } else if (sortKey === "status") {
      res = a.status.localeCompare(b.status);
    } else {
      // sortKey === "created" - use id as proxy for created date
      res = a.id - b.id;
    }
    return sortDir === "asc" ? res : -res;
  });

  return list;
}