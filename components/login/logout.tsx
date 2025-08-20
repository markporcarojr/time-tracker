// components/logout-button.tsx
"use client";

import * as React from "react";
import { useClerk } from "@clerk/nextjs";
import { toast } from "sonner";
import { IconLogout } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  /** Where to send the user after signing out */
  redirectUrl?: string;
  /** Render as a normal Button or as a DropdownMenuItem */
  variant?: "button" | "menu";
  /** Extra classes */
  className?: string;
  /** Custom label; defaults to "Log out" */
  children?: React.ReactNode;
};

export function LogoutButton({
  redirectUrl = "/sign-in",
  variant = "button",
  className,
  children,
}: LogoutButtonProps) {
  const { signOut } = useClerk();
  const [loading, setLoading] = React.useState(false);

  const doSignOut = async () => {
    if (loading) return;
    setLoading(true);

    const p = signOut({ redirectUrl });
    try {
      await toast.promise(p, {
        loading: "Signing out…",
        success: "Signed out",
        error: "Sign out failed",
      });
      // Clerk will redirect after signOut; no further action needed.
    } catch {
      // keep the button enabled again if something exploded before redirect
      setLoading(false);
    }
  };

  if (variant === "menu") {
    // Radix MenuItems should use onSelect to avoid focus flicker & preventDefault
    return (
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          void doSignOut();
        }}
        className={cn("cursor-pointer", className)}
      >
        <IconLogout className="mr-2 size-4" />
        {children ?? "Log out"}
      </DropdownMenuItem>
    );
  }

  // Default: standard button
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => void doSignOut()}
      disabled={loading}
      className={className}
    >
      <IconLogout className="mr-2 size-4" />
      {children ?? "Log out"}
    </Button>
  );
}
