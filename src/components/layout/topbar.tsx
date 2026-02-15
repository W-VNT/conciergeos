"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { MobileSidebar } from "./mobile-sidebar";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "@/components/shared/notification-bell";
import type { Profile } from "@/types/database";

export function Topbar({ profile }: { profile: Profile }) {
  return (
    <header className="h-14 sm:h-16 border-b bg-white dark:bg-gray-900 dark:border-gray-800 flex items-center justify-between px-3 sm:px-4 md:px-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 sm:h-10 sm:w-10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[85vw] sm:w-64">
            <MobileSidebar />
          </SheetContent>
        </Sheet>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <NotificationBell />
        <UserMenu profile={profile} />
      </div>
    </header>
  );
}
