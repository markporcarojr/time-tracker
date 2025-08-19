"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ManualEntryForm() {
  const [jobs, setJobs] = useState<{ id: number; customerName: string }[]>([]);
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
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Manual Time Entry</h1>

      <label className="block">
        Date
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </label>

      <label className="block">
        Duration (minutes)
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="w-full p-2 border rounded"
          required
          min={1}
        />
      </label>

      <label className="block">
        Job (optional)
        <select
          value={jobId ?? ""}
          onChange={(e) =>
            setJobId(e.target.value ? parseInt(e.target.value) : null)
          }
          className="w-full p-2 border rounded"
        >
          <option value="">No Job</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        Note (optional)
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </label>

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Submit
      </button>
    </form>
  );
}
