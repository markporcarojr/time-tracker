"use client";
import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";

export function fmtHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function LiveElapsed({
  totalMs,
  startedAtISO,
  className,
}: {
  totalMs: number;
  startedAtISO: string | null;
  className?: string;
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAtISO) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAtISO]);

  const extra = startedAtISO
    ? Math.max(0, nowMs - new Date(startedAtISO).getTime())
    : 0;

  const totalSec = Math.floor((totalMs + extra) / 1000);
  return <Badge className={className}>{fmtHMS(totalSec)}</Badge>;
}
