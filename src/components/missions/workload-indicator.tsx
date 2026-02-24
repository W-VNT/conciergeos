"use client";

import type { Mission } from "@/types/database";

interface WorkloadIndicatorProps {
  missions: Mission[];
}

// Estimated duration per mission type in minutes
const ESTIMATED_DURATION: Record<string, number> = {
  CHECKIN: 30,
  CHECKOUT: 30,
  MENAGE: 120,
  INTERVENTION: 60,
  URGENCE: 60,
};

const WEEKLY_CAPACITY_HOURS = 40; // 8h/day * 5 days

export function WorkloadIndicator({ missions }: WorkloadIndicatorProps) {
  const totalMinutes = missions.reduce((sum, m) => {
    return sum + (ESTIMATED_DURATION[m.type] ?? 60);
  }, 0);

  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const loadPercent = Math.round((totalHours / WEEKLY_CAPACITY_HOURS) * 100);

  const colorClass =
    loadPercent > 90
      ? "bg-red-500"
      : loadPercent > 70
      ? "bg-orange-500"
      : "bg-green-500";

  const textColorClass =
    loadPercent > 90
      ? "text-red-700 dark:text-red-400"
      : loadPercent > 70
      ? "text-orange-700 dark:text-orange-400"
      : "text-green-700 dark:text-green-400";

  return (
    <div className="space-y-1">
      <p className={`text-xs font-medium ${textColorClass}`}>
        {missions.length} mission{missions.length > 1 ? "s" : ""}, {totalHours}h
        estimees
      </p>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${Math.min(loadPercent, 100)}%` }}
        />
      </div>
    </div>
  );
}
