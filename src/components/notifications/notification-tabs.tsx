"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NotificationFilter } from "@/lib/actions/notifications";

interface NotificationTabsProps {
  activeTab: NotificationFilter;
}

const TABS: { key: NotificationFilter; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "unread", label: "Non lu" },
  { key: "MISSION_ASSIGNED", label: "Missions" },
  { key: "INCIDENT_CRITICAL", label: "Incidents" },
  { key: "SYSTEM", label: "Systeme" },
];

export function NotificationTabs({ activeTab }: NotificationTabsProps) {
  const router = useRouter();

  function handleTabClick(tab: NotificationFilter) {
    if (tab === "all") {
      router.push("/notifications");
    } else {
      router.push(`/notifications?tab=${tab}`);
    }
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {TABS.map(({ key, label }) => (
        <Button
          key={key}
          variant="ghost"
          size="sm"
          onClick={() => handleTabClick(key)}
          className={cn(
            "rounded-full px-4 text-sm",
            activeTab === key
              ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
