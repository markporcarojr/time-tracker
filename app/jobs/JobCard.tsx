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
import { fmtHMS } from "../../lib/utils"; // Assuming this is your time formatting function
import { Pencil, Play, Square, Trash2 } from "lucide-react";
import { useRouter } from "next/router";

type JobCardProps = {
  props: {
    id: string | number;
    customerName: string;
    jobNumber: string | number;
    description?: string;
  };
  running: boolean;
  displaySec: number;
  baseMs: number;
  start: () => void;
  stop: () => void;
  doDelete: () => void;
};

export default function JobCard({
  props,
  running,
  displaySec,
  baseMs,
  start,
  stop,
  doDelete,
}: JobCardProps) {
  const router = useRouter();

  return (
    <Card className="group relative overflow-hidden rounded-2xl border-2 border-border/80 bg-background shadow-lg transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl">
      {/* Optional: Add a subtle linear gradient to the top for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-border/50 via-transparent"
      />

      {/* Soft grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--tw-ring) 1px, transparent 1px), linear-gradient(to bottom, var(--tw-ring) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          // @ts-expect-error: Custom CSS variable '--tw-ring' is not recognized by TypeScript but is required for grid styling
          "--tw-ring": "hsl(var(--ring))",
        }}
      />

      {/* Header and content are now side-by-side */}
      <div className="flex flex-col md:flex-row md:items-center p-6 md:p-8 md:gap-8">
        {/* Left side: Job info */}
        <div className="min-w-0 md:flex-1">
          <CardTitle className="flex items-center gap-2">
            <span className="truncate text-foreground">
              {props.customerName.toUpperCase()}
            </span>
          </CardTitle>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Job: {props.jobNumber}
          </p>
          {props.description && (
            <CardDescription className="mt-2 line-clamp-2 text-muted-foreground">
              {props.description.toUpperCase()}
            </CardDescription>
          )}
        </div>

        {/* Right side: Time display */}
        <div className="flex flex-col items-start md:items-end mt-4 md:mt-0 md:min-w-[200px]">
          <div className="font-mono text-[42px] leading-none tracking-tight sm:text-[56px] font-bold text-foreground">
            {fmtHMS(running ? displaySec : Math.floor(baseMs / 1000))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Total Saved:{" "}
            <strong className="font-semibold text-foreground">
              {fmtHMS(Math.floor(baseMs / 1000))}
            </strong>
            {running && (
              <span className="ml-2 flex items-center text-primary animate-pulse">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="ml-2 text-xs">Live</span>
              </span>
            )}
          </p>
        </div>
      </div>

      <Separator />

      {/* Button group */}
      <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Edit Button */}
        <Button
          onClick={() => router.push(`/jobs/${props.id}/edit`)}
          variant="secondary"
          className="w-full"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit Job
        </Button>

        {/* Start/Stop Button */}
        {!running ? (
          <Button
            onClick={start}
            className="w-full md:col-span-1"
            variant="default"
          >
            <Play className="mr-2 h-4 w-4" />
            Start Timer
          </Button>
        ) : (
          <Button
            onClick={stop}
            className="w-full md:col-span-1"
            variant="default"
          >
            <Square className="mr-2 h-4 w-4" />
            Stop Timer
          </Button>
        )}

        {/* Delete Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Job
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete &quot;{props.jobNumber}&quot;?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the job and all timing data. This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={doDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}
