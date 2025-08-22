import { motion } from "framer-motion";
import Link from "next/link";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { convertToHours } from "@/lib/msToHours";
import { TotalCell } from "@/lib/utils";
import { Job } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { STATUS_META } from "@/data/statusMeta";
import {
  Clock,
  EllipsisVertical,
  Hash,
  Pencil,
  Trash2,
  User2,
} from "lucide-react";
import { JobRow } from "../dashboard/JobsTable";
import Meta from "./Meta";
import StatusPill from "./StatusPill";

export default function JobCard({
  job,
  deleting,
  isPending,
  onDelete,
}: {
  job: Job;
  deleting: boolean;
  isPending: boolean;
  onDelete: () => void;
}) {
  const meta = STATUS_META[job.status];

  return (
    <motion.div
      initial={{ y: 0, opacity: 1 }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div
        className={`
          relative overflow-hidden rounded-2xl border border-border/60 bg-card/80
          shadow-sm ring-1 ring-border/40 backdrop-blur
          hover:shadow-md
        `}
      >
        {/* subtle status accent line */}
        <div className={`absolute inset-x-0 top-0 h-1 ${meta.bar}`} />

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Title / Meta */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/jobs/${job.id}`}
                  className="text-base font-semibold leading-tight hover:underline"
                  aria-label={`Open job ${job.customerName}`}
                >
                  {job.customerName}
                </Link>
                <StatusPill status={job.status} />
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <Meta
                  icon={<Hash className="h-3.5 w-3.5" />}
                  title="Job number"
                >
                  {job.jobNumber ?? (
                    <span className="italic text-muted-foreground">
                      No Job #
                    </span>
                  )}
                </Meta>
                <Meta icon={<User2 className="h-3.5 w-3.5" />} title="Customer">
                  {job.customerName}
                </Meta>
              </div>
            </div>

            {/* Right cluster: time + menu */}
            <div className="flex items-start gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="font-mono text-[11px]">
                      <Clock className="mr-1 h-3.5 w-3.5" />
                      <TotalCell job={job as JobRow} />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="left">Live elapsed time</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                    aria-label="Open actions"
                  >
                    <EllipsisVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4" />
                      View
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/jobs/${job.id}/edit`}
                      className="flex items-center gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        disabled={deleting || isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete job</AlertDialogTitle>
                        <AlertDialogDescription>
                          Delete “{job.customerName}”? This also removes all
                          associated time sessions.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={onDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Description */}
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {job.description || <span className="italic">No description</span>}
          </p>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block size-2 rounded-full ${meta.dot}`}
              />
              <span className="text-xs text-muted-foreground">Status</span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-[11px]">
                {convertToHours(job.totalMs) || 0}h
              </Badge>

              <Button
                asChild
                size="sm"
                className="
                  rounded-full px-3
                  bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground
                  hover:opacity-95
                "
              >
                <Link href={`/jobs/${job.id}`}>Open</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
