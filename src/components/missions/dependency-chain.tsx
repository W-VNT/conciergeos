"use client";

import { Badge } from "@/components/ui/badge";
import {
  MISSION_TYPE_LABELS,
  MISSION_STATUS_LABELS,
} from "@/types/database";
import type { MissionType, MissionStatus } from "@/types/database";
import { ArrowRight, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

interface DependencyMission {
  id: string;
  type: MissionType;
  status: MissionStatus;
}

interface DependencyChainProps {
  currentMission: DependencyMission;
  dependsOn: DependencyMission | null;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  TERMINE: <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />,
  EN_COURS: <Clock className="h-3.5 w-3.5 text-blue-600" />,
  A_FAIRE: <Clock className="h-3.5 w-3.5 text-gray-400" />,
  ANNULE: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
};

const STATUS_BG: Record<string, string> = {
  TERMINE: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
  EN_COURS: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
  A_FAIRE: "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700",
  ANNULE: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
};

function MissionChip({ mission }: { mission: DependencyMission }) {
  return (
    <Link href={`/missions/${mission.id}`}>
      <div
        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm hover:shadow-sm transition-shadow cursor-pointer ${
          STATUS_BG[mission.status] ?? STATUS_BG.A_FAIRE
        }`}
      >
        {STATUS_ICON[mission.status]}
        <span className="font-medium">
          {MISSION_TYPE_LABELS[mission.type as keyof typeof MISSION_TYPE_LABELS]}
        </span>
        <Badge
          variant={mission.status === "TERMINE" ? "secondary" : "outline"}
          className="text-[10px] px-1.5 py-0 h-4"
        >
          {MISSION_STATUS_LABELS[mission.status as keyof typeof MISSION_STATUS_LABELS]}
        </Badge>
      </div>
    </Link>
  );
}

export function DependencyChain({
  currentMission,
  dependsOn,
}: DependencyChainProps) {
  if (!dependsOn) return null;

  const isBlocked = dependsOn.status !== "TERMINE";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <MissionChip mission={dependsOn} />
        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <MissionChip mission={currentMission} />
      </div>
      {isBlocked && (
        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-300">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            La mission{" "}
            <strong>
              {MISSION_TYPE_LABELS[dependsOn.type as keyof typeof MISSION_TYPE_LABELS]}
            </strong>{" "}
            doit etre terminee avant de pouvoir demarrer cette mission
          </span>
        </div>
      )}
    </div>
  );
}
