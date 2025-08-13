"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

type Job = {
  id: number;
  name: string;
  description: string | null;
  status: "ACTIVE" | "DONE" | "PAUSED" | "MANUAL";
};

interface JobListClientProps {
  initialJobs: Job[];
}

export default function JobListClient({ initialJobs }: JobListClientProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [deletingJobId, setDeletingJobId] = useState<number | null>(null);

  const handleDeleteJob = async (jobId: number) => {
    setDeletingJobId(jobId);

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove the job from the list
        setJobs(jobs.filter((job) => job.id !== jobId));
      } else {
        console.error("Failed to delete job");
        // You could add a toast notification here
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      // You could add a toast notification here
    } finally {
      setDeletingJobId(null);
    }
  };

  if (jobs.length === 0) {
    return (
      <Card className="shadow-plate border-border">
        <CardHeader>
          <CardTitle>All jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No jobs found. Create your first job to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-plate border-border">
      <CardHeader>
        <CardTitle>All jobs</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {jobs.map((job) => (
            <li key={job.id} className="relative">
              <div className="group rounded-hard border border-border bg-card p-4 shadow-hard hover:opacity-95">
                <Link href={`/jobs/${job.id}`} className="block">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{job.name}</div>
                    <Badge variant="secondary">{job.status}</Badge>
                  </div>
                  {job.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {job.description}
                    </p>
                  ) : null}
                </Link>

                {/* Delete button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      disabled={deletingJobId === job.id}
                    >
                      {deletingJobId === job.id ? (
                        <Skeleton className="h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Job</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &quot;{job.name}&quot;?
                        This action cannot be undone and will also delete all
                        associated time sessions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteJob(job.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
