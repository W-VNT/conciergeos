"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MISSION_TYPE_LABELS, MISSION_STATUS_LABELS } from "@/types/database";
import type { Mission, MissionType, MissionStatus } from "@/types/database";
import type { PlanningOperator } from "@/lib/actions/planning";
import { WorkloadIndicator } from "./workload-indicator";
import {
  format,
  parseISO,
  startOfWeek,
  addDays,
  isSameDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  LogIn,
  LogOut,
  Sparkles,
  Wrench,
  AlertTriangle,
  User,
} from "lucide-react";
import Link from "next/link";

interface PlanningViewProps {
  operators: PlanningOperator[];
  unassigned: Mission[];
  weekStart: string;
}

const MISSION_TYPE_ICONS: Record<MissionType, React.ReactNode> = {
  CHECKIN: <LogIn className="h-3 w-3" />,
  CHECKOUT: <LogOut className="h-3 w-3" />,
  MENAGE: <Sparkles className="h-3 w-3" />,
  INTERVENTION: <Wrench className="h-3 w-3" />,
  URGENCE: <AlertTriangle className="h-3 w-3" />,
};

const STATUS_COLORS: Record<MissionStatus, string> = {
  A_FAIRE: "bg-gray-100 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300",
  EN_COURS: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300",
  TERMINE: "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300",
  ANNULE: "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300",
};

const PRIORITY_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  NORMALE: "secondary",
  HAUTE: "default",
  CRITIQUE: "destructive",
};

function MissionCard({ mission }: { mission: Mission }) {
  const logement = mission.logement as { id: string; name: string } | null;
  const scheduledAt = parseISO(mission.scheduled_at);
  const statusColor = STATUS_COLORS[mission.status as MissionStatus] ?? STATUS_COLORS.A_FAIRE;

  return (
    <Link href={`/missions/${mission.id}`}>
      <div
        className={`rounded-md border px-2 py-1.5 text-xs cursor-pointer hover:shadow-sm transition-shadow ${statusColor}`}
      >
        <div className="flex items-center gap-1 mb-0.5">
          {MISSION_TYPE_ICONS[mission.type as MissionType]}
          <span className="font-medium truncate">
            {MISSION_TYPE_LABELS[mission.type as keyof typeof MISSION_TYPE_LABELS]}
          </span>
          {mission.priority !== "NORMALE" && (
            <Badge
              variant={PRIORITY_BADGE_VARIANT[mission.priority] ?? "secondary"}
              className="text-[10px] px-1 py-0 h-4 ml-auto"
            >
              {mission.priority === "CRITIQUE" ? "!" : "H"}
            </Badge>
          )}
        </div>
        {logement && (
          <p className="text-[10px] truncate opacity-80">{logement.name}</p>
        )}
        <p className="text-[10px] opacity-60 tabular-nums">
          {format(scheduledAt, "HH:mm")}
        </p>
      </div>
    </Link>
  );
}

function getDaysOfWeek(weekStartStr: string) {
  const weekStart = startOfWeek(parseISO(weekStartStr), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

function getMissionsForDay(missions: Mission[], day: Date): Mission[] {
  return missions.filter((m) => {
    const scheduledDate = parseISO(m.scheduled_at);
    return isSameDay(scheduledDate, day);
  });
}

export function PlanningView({
  operators,
  unassigned,
  weekStart,
}: PlanningViewProps) {
  const days = useMemo(() => getDaysOfWeek(weekStart), [weekStart]);

  return (
    <div className="space-y-6">
      {/* Operator rows */}
      {operators.map((op) => (
        <Card key={op.profile.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>
                <CardTitle className="text-base truncate">
                  {op.profile.full_name}
                </CardTitle>
              </div>
              <div className="flex-shrink-0 w-40">
                <WorkloadIndicator missions={op.missions} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className="text-center text-xs font-medium text-muted-foreground pb-1 border-b"
                >
                  <span className="hidden sm:inline">
                    {format(day, "EEE d", { locale: fr })}
                  </span>
                  <span className="sm:hidden">
                    {format(day, "EEEEE d", { locale: fr })}
                  </span>
                </div>
              ))}
              {/* Mission cells */}
              {days.map((day) => {
                const dayMissions = getMissionsForDay(op.missions, day);
                return (
                  <div
                    key={day.toISOString()}
                    className="min-h-[60px] space-y-1 pt-1"
                  >
                    {dayMissions.map((mission) => (
                      <MissionCard key={mission.id} mission={mission} />
                    ))}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Unassigned missions */}
      {unassigned.length > 0 && (
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-muted-foreground">
              Missions non assignees ({unassigned.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className="text-center text-xs font-medium text-muted-foreground pb-1 border-b"
                >
                  <span className="hidden sm:inline">
                    {format(day, "EEE d", { locale: fr })}
                  </span>
                  <span className="sm:hidden">
                    {format(day, "EEEEE d", { locale: fr })}
                  </span>
                </div>
              ))}
              {/* Mission cells */}
              {days.map((day) => {
                const dayMissions = getMissionsForDay(unassigned, day);
                return (
                  <div
                    key={day.toISOString()}
                    className="min-h-[60px] space-y-1 pt-1"
                  >
                    {dayMissions.map((mission) => (
                      <MissionCard key={mission.id} mission={mission} />
                    ))}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {operators.length === 0 && unassigned.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">Aucune mission cette semaine</p>
          <p className="text-sm mt-1">
            Les missions planifiees apparaitront ici
          </p>
        </div>
      )}
    </div>
  );
}
