"use client";

import { useEffect, useState } from "react";
import { JobStatus } from "@/types/prisma";

interface AdminJob {
  id: number;
  jobNumber: number | null;
  customerName: string;
  description: string | null;
  status: JobStatus;
  startedAt: string | null;
  stoppedAt: string | null;
  totalMs: number;
  userId: number;
  user: {
    id: number;
    name: string | null;
    email: string | null;
  };
}

export function AdminJobsTable() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const response = await fetch("/api/admin/jobs");
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("Unauthorized - Admin access required");
          }
          throw new Error("Failed to fetch jobs");
        }
        const data = await response.json();
        setJobs(data.jobs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);

  const formatTime = (ms: number) => {
    if (ms === 0) return "0:00:00";
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  if (loading) return <div className="p-4">Loading jobs...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left border-b">User</th>
            <th className="px-4 py-2 text-left border-b">Job #</th>
            <th className="px-4 py-2 text-left border-b">Customer</th>
            <th className="px-4 py-2 text-left border-b">Description</th>
            <th className="px-4 py-2 text-left border-b">Status</th>
            <th className="px-4 py-2 text-left border-b">Total Time</th>
            <th className="px-4 py-2 text-left border-b">Started</th>
            <th className="px-4 py-2 text-left border-b">Stopped</th>
          </tr>
        </thead>
        <tbody>
          {jobs.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                No jobs found
              </td>
            </tr>
          ) : (
            jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b">
                  <div>
                    <div className="font-medium">{job.user.name || "Unknown"}</div>
                    <div className="text-sm text-gray-500">{job.user.email}</div>
                  </div>
                </td>
                <td className="px-4 py-2 border-b">{job.jobNumber || "-"}</td>
                <td className="px-4 py-2 border-b">{job.customerName}</td>
                <td className="px-4 py-2 border-b max-w-xs truncate">
                  {job.description || "-"}
                </td>
                <td className="px-4 py-2 border-b">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    job.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                    job.status === "PAUSED" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-4 py-2 border-b font-mono">
                  {formatTime(job.totalMs)}
                </td>
                <td className="px-4 py-2 border-b text-sm">
                  {formatDate(job.startedAt)}
                </td>
                <td className="px-4 py-2 border-b text-sm">
                  {formatDate(job.stoppedAt)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}