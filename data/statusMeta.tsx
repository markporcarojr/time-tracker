import { CirclePlay, CirclePause, Wrench, BadgeCheck } from "lucide-react";

export const STATUS_META = {
  ACTIVE: {
    dot: "bg-emerald-500",
    pill: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
    bar: "bg-gradient-to-r from-emerald-500/70 to-emerald-400/40",
    icon: <CirclePlay className="h-3.5 w-3.5" />,
  },
  PAUSED: {
    dot: "bg-amber-500",
    pill: "bg-amber-500/10 text-amber-600 ring-amber-500/20",
    bar: "bg-gradient-to-r from-amber-500/70 to-amber-400/40",
    icon: <CirclePause className="h-3.5 w-3.5" />,
  },
  MANUAL: {
    dot: "bg-sky-500",
    pill: "bg-sky-500/10 text-sky-700 ring-sky-500/20",
    bar: "bg-gradient-to-r from-sky-500/70 to-sky-400/40",
    icon: <Wrench className="h-3.5 w-3.5" />,
  },
  DONE: {
    dot: "bg-muted-foreground/60",
    pill: "bg-muted text-muted-foreground ring-muted/10",
    bar: "bg-muted",
    icon: <BadgeCheck className="h-3.5 w-3.5" />,
  },
} as const;
