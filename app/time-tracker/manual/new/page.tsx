"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ManualEntryForm() {
  const [jobs, setJobs] = useState<{ id: number; name: string }[]>([]);
  const [jobId, setJobId] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState(60); // minutes
  const [note, setNote] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/jobs/list")
      .then((res) => res.json())
      .then((data) => setJobs(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch("/api/time/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, date, duration, note }),
    });

    router.push("/time-tracker");
  };

  return (
    <div className="mx-auto max-w-xl p-6">
      <Card className="shadow-plate border-border">
        <CardHeader>
          <CardTitle>Manual Time Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                required
                min={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job">Job (optional)</Label>
              <Select
                value={jobId?.toString() ?? ""}
                onValueChange={(value) => setJobId(value ? parseInt(value) : null)}
              >
                <SelectTrigger id="job">
                  <SelectValue placeholder="Select a job (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Job</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add any notes about this time entry..."
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="bg-primary text-primary-foreground"
              >
                Submit
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
