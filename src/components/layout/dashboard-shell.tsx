"use client";

import { useState, useEffect, useRef } from "react";
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
        visible={topbarVisible}
      />
      <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      <BottomTabBar isAdmin={profile.role === "ADMIN"} />
    </>
  );
}
