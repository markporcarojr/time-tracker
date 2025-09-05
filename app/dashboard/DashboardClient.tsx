"use client";

import { useState, useMemo } from "react";
import { JobsTable } from "./JobsTable";
import JobsSearch, { type StatusFilter, type SortKey, type SortDir } from "./JobsSearch";
import { filterAndSortJobs } from "./jobsFilterUtils";
import type { Job } from "@/types/prisma";

interface DashboardClientProps {
  initialJobs: Job[];
}

export default function DashboardClient({ initialJobs }: DashboardClientProps) {
  const [jobs] = useState<Job[]>(initialJobs);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filteredSorted = useMemo(() => {
    return filterAndSortJobs(jobs, query, status, sortKey, sortDir);
  }, [jobs, query, status, sortKey, sortDir]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
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