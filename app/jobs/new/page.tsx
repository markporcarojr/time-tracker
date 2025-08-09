"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NewJobPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });

    if (!res.ok) {
      alert(await res.text());
      return;
    }
    const job = await res.json();
    router.push(`/jobs/${job.id}`); // go straight to timer page
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <Card className="shadow-plate border-border">
        <CardHeader>
          <CardTitle>New Job</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm">Job name</label>
              <input
                className="mt-1 w-full rounded-hard border border-border bg-background p-2"
                placeholder="e.g. CNC Part #A12"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm">Description</label>
              <textarea
                className="mt-1 w-full rounded-hard border border-border bg-background p-2"
                rows={3}
                placeholder="Optional"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="bg-primary text-primary-foreground"
              >
                Create
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
