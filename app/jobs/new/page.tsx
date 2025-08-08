"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type JobStatus = "ACTIVE" | "PAUSED" | "DONE";

export default function NewJobPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<JobStatus>("ACTIVE");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // backend should accept { name, description, status }
        body: JSON.stringify({
          name,
          description: description || null,
          status,
        }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        setError(msg || "Failed to create job.");
        setSubmitting(false);
        return;
      }

      const { id } = await res.json();
      router.push(`/jobs/${id}`);
    } catch (err) {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[60vh] p-6">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-xl space-y-5 card-surface p-6"
      >
        <h1 className="text-2xl font-semibold">New Job</h1>

        {error && (
          <div className="border border-destructive text-destructive rounded-[var(--radius)] px-3 py-2 bg-background">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm">Job name</label>
          <input
            type="text"
            placeholder="e.g. Turn OD + thread ops"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-card text-foreground border border-border rounded-[var(--radius)] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm">Description (optional)</label>
          <textarea
            placeholder="Material, part count, notes…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-28 bg-card text-foreground border border-border rounded-[var(--radius)] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as JobStatus)}
            className="w-full bg-card text-foreground border border-border rounded-[var(--radius)] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="PAUSED">PAUSED</option>
            <option value="DONE">DONE</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="button-hard bg-primary text-primary-foreground px-4 py-2 rounded-[var(--radius)] disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save Job"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/jobs")}
            className="border border-border px-4 py-2 rounded-[var(--radius)]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
