"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "@/components/shared/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Profile, Organisation } from "@/types/database";

interface TopbarProps {
  profile: Profile;
  organisation: Organisation | null;
  onOpenMenu?: () => void;
  visible?: boolean;
}

export function Topbar({ profile, organisation, onOpenMenu, visible = true }: TopbarProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-40 bg-white dark:bg-gray-900 transition-transform duration-300",
        !visible && "-translate-y-full"
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <header className="h-14 sm:h-16 border-b dark:border-gray-800 flex items-center justify-between px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenMenu && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 sm:h-10 sm:w-10"
              onClick={onOpenMenu}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <NotificationBell />
          <ThemeToggle />
          <UserMenu profile={profile} />
        </div>
      </header>
    </div>
  );
}
