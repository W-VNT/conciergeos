"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { toast } from "sonner";
import type { Mission, MissionType } from "@/types/database";
import { MISSION_TYPE_LABELS } from "@/types/database";
import { formatTime } from "@/lib/format-date";

const MISSION_TYPE_BORDER_COLORS: Record<MissionType, string> = {
  CHECKIN: "border-l-blue-500",
  CHECKOUT: "border-l-purple-500",
  MENAGE: "border-l-green-500",
  INTERVENTION: "border-l-orange-500",
  URGENCE: "border-l-red-500",
};

interface CalendarDndWrapperProps {
  children: React.ReactNode;
  missions: Mission[];
  onReschedule: (missionId: string, newDate: string) => Promise<{ success: boolean; error?: string; message?: string }>;
}

export function CalendarDndWrapper({
  children,
  missions,
  onReschedule,
}: CalendarDndWrapperProps) {
  const [activeMission, setActiveMission] = useState<Mission | null>(null);

  // Require a minimum drag distance to avoid accidental drags when clicking
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const missionId = event.active.id as string;
      const mission = missions.find((m) => m.id === missionId);
      if (mission) {
        setActiveMission(mission);
      }
    },
    [missions]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveMission(null);

      const { active, over } = event;
      if (!over) return;

      const missionId = active.id as string;
      const newDateTime = over.id as string;

      // Validate that the over target is a valid droppable cell (ISO datetime string)
      if (!newDateTime || !newDateTime.includes("T")) return;

      try {
        const result = await onReschedule(missionId, newDateTime);
        if (result.success) {
          toast.success(result.message ?? "Mission replanifiée");
        } else {
          toast.error(result.error ?? "Erreur lors de la replanification");
        }
      } catch {
        toast.error("Erreur lors de la replanification");
      }
    },
    [onReschedule]
  );

  const handleDragCancel = useCallback(() => {
    setActiveMission(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay>
        {activeMission ? (
          <div
            className={`flex items-center gap-2 px-2.5 py-2 rounded border-l-4 bg-background shadow-lg ring-1 ring-black/5 ${
              MISSION_TYPE_BORDER_COLORS[activeMission.type as MissionType]
            }`}
          >
            <span className="text-xs font-mono text-muted-foreground">
              {formatTime(activeMission.scheduled_at)}
            </span>
            <span className="text-sm font-medium">
              {MISSION_TYPE_LABELS[activeMission.type as MissionType]}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {(activeMission.logement as { name: string } | null)?.name}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
