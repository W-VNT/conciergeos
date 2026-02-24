"use client";

import { useState, useEffect, useRef } from "react";
import { Topbar } from "./topbar";
import { BottomTabBar } from "./bottom-tab-bar";
import { PullToRefresh } from "./pull-to-refresh";
import { PushPermissionPrompt } from "@/components/shared/push-permission-prompt";
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
  const scrollDelta = useRef(0);

  useEffect(() => {
    const THRESHOLD = 10;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      if (Math.sign(diff) !== Math.sign(scrollDelta.current)) {
        scrollDelta.current = 0;
      }
      scrollDelta.current += diff;

      if (scrollDelta.current > THRESHOLD && currentScrollY > 60) {
        setTopbarVisible(false);
        scrollDelta.current = 0;
      } else if (scrollDelta.current < -THRESHOLD) {
        setTopbarVisible(true);
        scrollDelta.current = 0;
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
      <PushPermissionPrompt />
      <PullToRefresh>
        <main className="flex-1 p-4 md:p-6 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-6">{children}</main>
      </PullToRefresh>
      <BottomTabBar />
    </>
  );
}
