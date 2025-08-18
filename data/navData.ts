// src/config/nav-data.ts
import {
  IconDashboard,
  IconBriefcase,
  IconTimeline,
  IconSettings,
  IconHelp,
  IconSearch,
} from "@tabler/icons-react";

export type NavLink = {
  title: string;
  url: string;
  icon?: React.ComponentType<any>;
  isActive?: boolean; // optional for marking active state
};

export const navMain: NavLink[] = [
  { title: "Dashboard", url: "/", icon: IconDashboard },
  { title: "Jobs", url: "/jobs", icon: IconBriefcase },
  { title: "Sessions", url: "/sessions", icon: IconTimeline },
];

export const navSecondary: NavLink[] = [
  { title: "Settings", url: "/settings", icon: IconSettings },
  { title: "Get Help", url: "/help", icon: IconHelp },
  { title: "Search", url: "/search", icon: IconSearch },
];
