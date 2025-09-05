// components/JobTimerDisplay.tsx
"use client";

import { fmtHMS } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type JobStatus = "ACTIVE" | "PAUSED" | "DONE";

interface JobTimerDisplayProps {
  status: JobStatus;
  baseMs: number;
  startedAt: number | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl"; // NEW
}

export default function JobTimerDisplay({
  status,
  baseMs,
  startedAt,
  className,
  size = "lg", // default
}: JobTimerDisplayProps) {
  const [displaySec, setDisplaySec] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const running = status === "ACTIVE";

  const recalc = () => {
    const liveMs = baseMs + (startedAt ? Date.now() - startedAt : 0);
    setDisplaySec(Math.floor(liveMs / 1000));
  };

  useEffect(() => {
    recalc();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(recalc, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseMs, startedAt]);

  // Map sizes to Tailwind classes
  const sizeClasses: Record<typeof size, string> = {
    sm: "text-[20px] sm:text-[24px]",
    md: "text-[28px] sm:text-[36px]",
    lg: "text-[42px] sm:text-[56px]", // original default
    xl: "text-[56px] sm:text-[72px]",
  };

  return (
    <div className={className}>
      <div
        className={`font-mono leading-none tracking-tight font-bold text-foreground ${sizeClasses[size]}`}
      >
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
  );
}
