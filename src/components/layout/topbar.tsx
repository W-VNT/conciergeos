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
    <header className="h-16 border-b bg-white dark:bg-gray-900 dark:border-gray-800 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <MobileSidebar />
          </SheetContent>
        </Sheet>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <UserMenu profile={profile} />
      </div>
    </header>
  );
}
