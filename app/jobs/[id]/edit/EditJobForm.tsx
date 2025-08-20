// app/jobs/[id]/edit/EditJobForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Job = {
  id: number;
  jobNumber: number | null;
  customerName: string;
  description: string | null;
  status: "ACTIVE" | "PAUSED" | "DONE";
  totalMs: number;
  startedAt: Date | null;
};

function fmtHMS(ms: number) {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function EditJobForm({ job }: { job: Job }) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState(job.customerName);
  const [jobNumber, setJobNumber] = useState(job.jobNumber?.toString() ?? "");
  const [description, setDescription] = useState(job.description ?? "");
  const [status, setStatus] = useState<Job["status"]>(job.status);
  const [addMinutes, setAddMinutes] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        description: description || null,
        jobNumber: jobNumber ? Number(jobNumber) : null,
        status,
        addMinutes: addMinutes > 0 ? addMinutes : undefined,
      }),
    });
    setSubmitting(false);
    if (!res.ok) return toast.error("Failed to update job");
    toast.success("Job updated");
    setResetting(false);
    router.push(`/jobs/${job.id}`);
    router.refresh();
  };

  const resetTotal = async () => {
    if (!confirm("Reset total time to 0 and stop the timer?")) return;
    setResetting(true);
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetTotal: true, status: "PAUSED" }),
    });
    setResetting(false);
    if (!res.ok) return toast.error("Failed to reset total");
    toast.success("Total reset to 0");
    router.refresh();
  };

  return (
    <Card className="shadow-plate border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Edit Job</CardTitle>
        <Badge variant="secondary">{job.status}</Badge>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Customer Name</Label>
            <Input
              id="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="jobNumber">Job Number</Label>
            <Input
              id="jobNumber"
              type="number"
              min={0}
              value={jobNumber}
              onChange={(e) => setJobNumber(e.target.value)}
              placeholder="12345"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as Job["status"])}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="PAUSED">PAUSED</SelectItem>
                <SelectItem value="DONE">DONE</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Changing away from ACTIVE will add the elapsed time and stop the
              timer. Setting to ACTIVE starts the timer if it isn’t running.
            </p>
          </div>

          <Separator />

          <div className="grid gap-2">
            <Label htmlFor="add">Add manual minutes</Label>
            <div className="flex gap-2">
              <Input
                id="add"
                type="number"
                min={0}
                value={addMinutes || ""}
                onChange={(e) => setAddMinutes(Number(e.target.value) || 0)}
                className="max-w-[160px]"
                placeholder="15"
              />
              <Button
                variant="secondary"
                onClick={submit}
                disabled={submitting}
              >
                Add & Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Adds to the saved total (doesn’t affect a running timer).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={submit} disabled={submitting}>
              Save changes
            </Button>
            <Button
              variant="destructive"
              onClick={resetTotal}
              disabled={resetting}
            >
              Reset total to 0
            </Button>
            <Link href={`/jobs/${job.id}`} className="underline text-sm">
              Cancel
            </Link>
          </div>

          <Separator />

          <div className="text-sm text-muted-foreground">
            Current saved total:{" "}
            <span className="font-mono">{fmtHMS(job.totalMs)}</span>
            {job.startedAt ? (
              <span className="ml-2">
                (running since {new Date(job.startedAt).toLocaleString()})
              </span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
