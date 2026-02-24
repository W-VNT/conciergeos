"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import type { Mission, MissionType } from "@/types/database";
import { MISSION_TYPE_LABELS } from "@/types/database";
import { formatTime } from "@/lib/format-date";

const MISSION_TYPE_COLORS: Record<MissionType, string> = {
  CHECKIN: "bg-blue-500",
  CHECKOUT: "bg-purple-500",
  MENAGE: "bg-green-500",
  INTERVENTION: "bg-orange-500",
  URGENCE: "bg-red-500",
};

const MISSION_TYPE_BORDER_COLORS: Record<MissionType, string> = {
  CHECKIN: "border-l-blue-500",
  CHECKOUT: "border-l-purple-500",
  MENAGE: "border-l-green-500",
  INTERVENTION: "border-l-orange-500",
  URGENCE: "border-l-red-500",
};

interface DraggableMissionCardProps {
  mission: Mission;
  /** "jour" view shows a larger card, "semaine" shows compact */
  variant?: "jour" | "semaine";
}

export function DraggableMissionCard({
  mission,
  variant = "jour",
}: DraggableMissionCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: mission.id,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const logement = mission.logement as { name: string } | null;

  if (variant === "semaine") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group relative text-xs p-0.5 sm:p-1 rounded border-l-2 bg-muted/40 leading-tight ${
          MISSION_TYPE_BORDER_COLORS[mission.type as MissionType]
        } ${isDragging ? "opacity-40" : ""}`}
      >
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            {...listeners}
            {...attributes}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Déplacer la mission"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </button>
          <Link href={`/missions/${mission.id}`} className="flex items-center gap-0.5 sm:gap-1 min-w-0 flex-1">
            <span
              className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${
                MISSION_TYPE_COLORS[mission.type as MissionType]
              }`}
            />
            <span className="hidden sm:inline font-medium">
              {formatTime(mission.scheduled_at)}
            </span>
            <span className="truncate font-medium">
              {MISSION_TYPE_LABELS[mission.type as MissionType]}
            </span>
          </Link>
        </div>
      </div>
    );
  }

  // "jour" variant — larger card
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-2 px-2.5 py-2.5 rounded border-l-4 bg-muted/40 hover:bg-muted transition-colors ${
        MISSION_TYPE_BORDER_COLORS[mission.type as MissionType]
      } ${isDragging ? "opacity-40" : ""}`}
    >
      <button
        {...listeners}
        {...attributes}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Déplacer la mission"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <Link href={`/missions/${mission.id}`} className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-xs font-mono text-muted-foreground">
          {formatTime(mission.scheduled_at)}
        </span>
        <span className="text-sm font-medium">
          {MISSION_TYPE_LABELS[mission.type as MissionType]}
        </span>
        <span className="text-xs text-muted-foreground truncate">
          {logement?.name}
        </span>
      </Link>
    </div>
  );
}
