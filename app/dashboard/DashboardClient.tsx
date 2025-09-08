"use client";

import { Button } from "@/components/ui/button";
import type { Job } from "@/types/prisma";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import JobsSearch, {
  type SortDir,
  type SortKey,
  type StatusFilter,
} from "./JobsSearch";
import { JobsTable } from "./JobsTable";
import { useUser } from "@clerk/nextjs";

interface DashboardClientProps {
  initialJobs: Job[];
}

export default function DashboardClient({ initialJobs }: DashboardClientProps) {
  const { user } = useUser();
  const userName =
    user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress;
  const [jobs] = useState<Job[]>(initialJobs);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filteredSorted = useMemo(() => {
    let list = [...jobs];

    // filter by status
    if (status !== "ALL") {
      list = list.filter((j) => j.status === status);
    }

    // filter by query
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (j) =>
          j.customerName.toLowerCase().includes(q) ||
          (j.description?.toLowerCase().includes(q) ?? false) ||
          (j.jobNumber !== null && j.jobNumber.toString().includes(q))
      );
    }

    // sorting
    list.sort((a, b) => {
      let res = 0;
      if (sortKey === "customerName") {
        res = a.customerName.localeCompare(b.customerName);
      } else if (sortKey === "status") {
        res = a.status.localeCompare(b.status);
      } else {
        // created proxy = use id
        res = a.id - b.id;
      }
      return sortDir === "asc" ? res : -res;
    });

    return list;
  }, [jobs, query, status, sortKey, sortDir]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between space-x-4">
        <h1 className="text-2xl font-bold m-6">{userName}'s Jobs</h1>
        <Button
          asChild
          className="rounded-full px-5 py-5 text-base font-medium bg-gradient-to-r from-primary to-primary/70 text-primary-foreground shadow-sm hover:opacity-95 flex items-center gap-2"
        >
          <Link href="/jobs/new" className="flex items-center gap-2 m-4">
            <Plus className="w-5 h-5" />
            <span>New Job</span>
          </Link>
        </Button>
      </div>

      <JobsSearch
        jobs={jobs}
        query={query}
        setQuery={setQuery}
        status={status}
        setStatus={setStatus}
        sortKey={sortKey}
        setSortKey={setSortKey}
        sortDir={sortDir}
        setSortDir={setSortDir}
        filteredSorted={filteredSorted}
      />

      <JobsTable data={filteredSorted} />
    </div>
  );
}
