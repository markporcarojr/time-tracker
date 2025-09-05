"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpDown, Filter, Search } from "lucide-react";
import { convertToHours } from "@/lib/msToHours";
import type { Job } from "@/types/prisma";

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

export default function JobsSearch({
  jobs,
  query,
  setQuery,
  status,
  setStatus,
  sortKey,
  setSortKey,
  sortDir,
  setSortDir,
  filteredSorted,
}: JobsSearchProps) {
  const counts = useMemo(() => {
    const active = jobs.filter((j) => j.status === "ACTIVE").length;
    const paused = jobs.filter((j) => j.status === "PAUSED").length;
    const done = jobs.filter((j) => j.status === "DONE").length;
    const totalMs = jobs.reduce((acc, j) => acc + j.totalMs, 0);
    return { total: jobs.length, active, paused, done, totalMs };
  }, [jobs]);

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <section
        className="
          rounded-2xl border border-border/60 bg-card/70 backdrop-blur
        "
      >
        <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-5">
          <StatChip label="Total" value={counts.total} tone="muted" />
          <StatChip label="Active" value={counts.active} tone="emerald" />
          <StatChip label="Paused" value={counts.paused} tone="amber" />
          <StatChip label="Done" value={counts.done} tone="muted" />
          <StatChip
            label="Total Hours"
            value={convertToHours(counts.totalMs) || 0}
            suffix="h"
            tone="primary"
          />
        </div>
      </section>

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
              placeholder="Search by customer, description, or job #"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Tabs (segmented) */}
          <div className="sm:col-span-2">
            <Label className="sr-only">Filter status</Label>
            <Tabs
              value={status}
              onValueChange={(v) => setStatus(v as StatusFilter)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4 rounded-full">
                <TabsTrigger value="ALL" className="rounded-full">
                  All
                </TabsTrigger>
                <TabsTrigger value="ACTIVE" className="rounded-full">
                  Active
                </TabsTrigger>
                <TabsTrigger value="PAUSED" className="rounded-full">
                  Paused
                </TabsTrigger>
                <TabsTrigger value="DONE" className="rounded-full">
                  Done
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <Separator />

        {/* Sort Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>
              Showing{" "}
              <strong className="text-foreground">
                {filteredSorted.length}
              </strong>{" "}
              of <strong className="text-foreground">{jobs.length}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={`${sortKey}:${sortDir}`}
              onValueChange={(val) => {
                const [k, d] = val.split(":") as [SortKey, SortDir];
                setSortKey(k);
                setSortDir(d);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="created:desc">Newest first</SelectItem>
                <SelectItem value="created:asc">Oldest first</SelectItem>
                <SelectItem value="customerName:asc">Name A–Z</SelectItem>
                <SelectItem value="customerName:desc">Name Z–A</SelectItem>
                <SelectItem value="status:asc">Status A–Z</SelectItem>
                <SelectItem value="status:desc">Status Z–A</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset filters button */}
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                setQuery("");
                setStatus("ALL");
                setSortKey("created");
                setSortDir("desc");
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Reusable Bits                                */
/* -------------------------------------------------------------------------- */

function StatChip({
  label,
  value,
  suffix,
  tone = "muted",
}: {
  label: string;
  value: number | string;
  suffix?: string;
  tone?: "muted" | "primary" | "emerald" | "amber" | "sky";
}) {
  const toneMap: Record<string, string> = {
    muted: "ring-border/60",
    primary: "ring-primary/30",
    emerald: "ring-emerald-500/30",
    amber: "ring-amber-500/30",
    sky: "ring-sky-500/30",
  };
  return (
    <div
      className={`
        flex items-center justify-between rounded-xl border border-border/60
        bg-card/70 px-4 py-3 ring-1 ${toneMap[tone]} backdrop-blur
      `}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold">
        {value}
        {suffix ? (
          <span className="ml-0.5 text-muted-foreground">{suffix}</span>
        ) : null}
      </span>
    </div>
  );
}