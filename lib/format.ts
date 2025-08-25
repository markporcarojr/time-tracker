// lib/format.ts
export function fmtHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function fmtHMSFromMs(totalMs: number) {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  return fmtHMS(totalSeconds);
}
