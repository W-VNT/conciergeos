"use client";

import Link from "next/link";
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
        "sticky top-0 z-40 bg-background transition-transform duration-300",
        !visible && "-translate-y-full"
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <header className="h-14 sm:h-16 border-b flex items-center justify-between px-3 sm:px-4 md:px-6">
        <Link href="/organisation" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {organisation?.logo_url ? (
            <Image
              src={organisation.logo_url}
              alt={organisation.name}
              width={40}
              height={40}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
          )}
          <span className="hidden sm:inline text-sm font-semibold truncate">
            {organisation?.name ?? "ConciergeOS"}
          </span>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <NotificationBell userId={profile.id} />
          <ThemeToggle />
          <UserMenu profile={profile} />
        </div>
      </header>
    </div>
  );
}
