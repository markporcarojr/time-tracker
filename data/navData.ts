// src/config/nav-data.ts
import type { Icon as TablerIcon } from "@tabler/icons-react";
import {
  IconBriefcase,
  IconDashboard,
  IconSettings,
  IconTimeline,
} from "@tabler/icons-react";

export type NavLink = {
  title: string;
  url: string;
  icon?: TablerIcon; // <- use Tabler's Icon type
};

export const navMain: NavLink[] = [
  { title: "Dashboard", url: "/", icon: IconDashboard },
  { title: "Jobs", url: "/jobs", icon: IconBriefcase },
  { title: "Sessions", url: "/sessions", icon: IconTimeline },
];

export const navSecondary: NavLink[] = [
  { title: "Settings", url: "/settings", icon: IconSettings },
];
