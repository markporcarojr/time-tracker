"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function NewJobPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [description, setDescription] = useState("");
  const [jobNumber, setJobNumber] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        description,
        jobNumber: jobNumber ? Number(jobNumber) : null,
      }),
    });

    if (!res.ok) {
      toast.error(await res.text());
      return;
    }
    toast.success("Job created successfully");
    // const job = await res.json();
    router.push("/dashboard"); // go straight to timer page
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
              <label className="text-sm">Customer Name</label>
              <input
                className="mt-1 w-full rounded-hard border border-border bg-background p-2"
                placeholder="Bristol, Mersino, etc... "
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm">Job #</label>
              <input
                className="mt-1 w-full rounded-hard border border-border bg-background p-2"
                placeholder="33347....."
                value={jobNumber}
                onChange={(e) => setJobNumber(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm">Description</label>
              <textarea
                className="mt-1 w-full rounded-hard border border-border bg-background p-2"
                rows={3}
                placeholder="Barrel, Gland, Piston, ...."
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
