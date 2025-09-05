"use client";

import { useEffect, useState } from "react";
import { IconShield } from "@tabler/icons-react";
import { NavLink } from "@/data/navData";

export function useAdminNav(): { items: NavLink[]; isLoading: boolean } {
  const [adminNavItems, setAdminNavItems] = useState<NavLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminStatus();
  }, []);

  return { items: adminNavItems, isLoading };
}