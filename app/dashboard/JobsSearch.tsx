"use client";

import { Input } from "@/components/ui/input";
import type { Job } from "@/types/prisma";
import { Search } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type StatusFilter = "ALL" | "ACTIVE" | "PAUSED" | "DONE";
export type SortKey = "created" | "customerName" | "status";
export type SortDir = "asc" | "desc";

interface JobsSearchProps {
  jobs: Job[];
  query: string;
  setQuery: (query: string) => void;
  status: StatusFilter;
  setStatus: (status: StatusFilter) => void;
  sortKey: SortKey;
  setSortKey: (sortKey: SortKey) => void;
  sortDir: SortDir;
  setSortDir: (sortDir: SortDir) => void;
  filteredSorted: Job[];
}

/* -------------------------------------------------------------------------- */
/*                              Main Component                                */
/* -------------------------------------------------------------------------- */

export default function JobsSearch({ query, setQuery }: JobsSearchProps) {
  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <section
        className="
          rounded-2xl border border-border/60 bg-card/70 backdrop-blur
        "
      >
        <div className="grid items-center gap-3 p-4 sm:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search jobs"
              placeholder="Search jobs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 rounded-3xl"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Reusable Bits                                */
/* -------------------------------------------------------------------------- */
