"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "@/components/shared/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Profile, Organisation } from "@/types/database";

interface TopbarProps {
  profile: Profile;
  organisation: Organisation | null;
  visible?: boolean;
}

export function Topbar({ profile, organisation, visible = true }: TopbarProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-40 bg-white dark:bg-gray-900 transition-transform duration-300",
        !visible && "-translate-y-full"
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <header className="h-14 sm:h-16 border-b dark:border-gray-800 flex items-center justify-between px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-2">
          {organisation?.logo_url ? (
            <Image
              src={organisation.logo_url}
              alt={organisation.name}
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
          )}
          <span className="text-sm font-semibold truncate max-w-[140px] sm:max-w-none">
            {organisation?.name ?? "ConciergeOS"}
          </span>
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
