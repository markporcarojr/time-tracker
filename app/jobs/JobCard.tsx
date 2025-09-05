"use client";

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
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Job } from "@/types/prisma";

type JobCardProps = {
  job: Job;
  deleting?: boolean;
  isPending?: boolean;
  onDelete: () => void;
};

export default function JobCard({
  job,
  deleting = false,
  isPending = false,
  onDelete,
}: JobCardProps) {
  const router = useRouter();

  const customerUpper = (job.customerName ?? "Unknown Customer")
    .toString()
    .toUpperCase();
  const descriptionUpper = job.description
    ? job.description.toString().toUpperCase()
    : null;

  return (
    <Card className="group relative overflow-hidden rounded-2xl border-2 border-border/80 bg-background shadow-lg transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center p-6 md:p-8 md:gap-8">
        <div className="min-w-0 md:flex-1">
          <CardTitle className="flex items-center gap-2">
            <span className="truncate text-foreground">{customerUpper}</span>
          </CardTitle>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Job: {job.jobNumber}
          </p>
          {descriptionUpper && (
            <CardDescription className="mt-2 line-clamp-2 text-muted-foreground">
              {descriptionUpper}
            </CardDescription>
          )}
        </div>
      </div>

      <Separator />

      {/* Buttons */}
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Edit */}
          <Button
            onClick={() => router.push(`/jobs/${job.id}/edit`)}
            variant="secondary"
            className="w-full md:w-auto flex-1"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Job
          </Button>

          {/* Timer buttons could go here later if you track running state */}

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full md:w-auto flex-1"
                disabled={deleting || isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting ? "Deleting..." : "Delete Job"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete &quot;{job.jobNumber}&quot;?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the job and all timing data. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}
