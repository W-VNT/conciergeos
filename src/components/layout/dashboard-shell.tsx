"use client";

import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { MobileSidebar } from "./mobile-sidebar";
import { Topbar } from "./topbar";
import { BottomTabBar } from "./bottom-tab-bar";
import type { Profile, Organisation } from "@/types/database";

interface DashboardShellProps {
  profile: Profile;
  organisation: Organisation | null;
  children: React.ReactNode;
}

export function DashboardShell({
  profile,
  organisation,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [topbarVisible, setTopbarVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setTopbarVisible(false);
      } else {
        setTopbarVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <Topbar
        profile={profile}
        organisation={organisation}
        onOpenMenu={() => setSidebarOpen(true)}
        visible={topbarVisible}
      />
      <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      <BottomTabBar isAdmin={profile.role === "ADMIN"} />

      {/* Sidebar mobile (ouvert via burger menu topbar) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-full sm:w-64">
          <MobileSidebar
            profile={profile}
            organisation={organisation}
            onClose={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
