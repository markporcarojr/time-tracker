"use client";
import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { fmtHMS } from "@/lib/format";

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
