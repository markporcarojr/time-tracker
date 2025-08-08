"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewSession() {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => {
    const start = new Date();
    setStartTime(start);

    fetch("/api/time", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startTime: start }),
    }).then((res) => {
      if (!res.ok) {
        console.error("Failed to start session");
      }
    });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Tracking Time...</h1>
      <p className="text-lg mb-6">
        Session started at: {startTime?.toLocaleTimeString()}
      </p>

      <button
        onClick={async () => {
          await fetch("/api/time/stop", { method: "PATCH" });
          router.push("/time-tracker");
        }}
        className="bg-red-600 text-white px-4 py-2 rounded"
      >
        Stop Session
      </button>
    </div>
  );
}
