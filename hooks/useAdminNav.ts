"use client";

import { useEffect, useState } from "react";
import { IconShield } from "@tabler/icons-react";
import { NavLink } from "@/data/navData";

export function useAdminNav(): NavLink[] {
  const [adminNavItems, setAdminNavItems] = useState<NavLink[]>([]);

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const response = await fetch("/api/admin/jobs", {
          method: "HEAD", // Just check if we have access
        });
        
        if (response.ok || response.status === 200) {
          setAdminNavItems([
            { title: "Admin", url: "/admin", icon: IconShield },
          ]);
        }
      } catch (error) {
        // User is not admin, no admin nav items
        console.log("User is not admin");
      }
    }

    checkAdminStatus();
  }, []);

  return adminNavItems;
}