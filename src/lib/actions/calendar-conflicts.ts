"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { MissionType } from "@/types/database";

export interface CalendarConflict {
  mission1_id: string;
  mission2_id: string;
  operator_name: string;
  operator_id: string;
  date: string;
  details: string;
  mission1_type: MissionType;
  mission2_type: MissionType;
}

/**
 * Detect scheduling conflicts: two missions assigned to the same operator
 * with overlapping scheduled_at times (within 2 hours of each other).
 */
export async function detectConflicts(
  startDate: string,
  endDate: string
): Promise<CalendarConflict[]> {
  const profile = await requireProfile();
  const supabase = createClient();

  // Fetch all assigned missions in the date range
  const { data: missions, error } = await supabase
    .from("missions")
    .select("id, type, scheduled_at, assigned_to")
    .eq("organisation_id", profile.organisation_id)
    .not("assigned_to", "is", null)
    .gte("scheduled_at", `${startDate}T00:00:00`)
    .lte("scheduled_at", `${endDate}T23:59:59`)
    .neq("status", "ANNULE")
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("Error fetching missions for conflict detection:", error);
    return [];
  }

  if (!missions || missions.length === 0) return [];

  // Fetch operator names
  const operatorIds = Array.from(new Set(missions.map((m) => m.assigned_to).filter(Boolean))) as string[];
  const { data: operators } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", operatorIds);

  const operatorMap: Record<string, string> = {};
  for (const op of operators ?? []) {
    operatorMap[op.id] = op.full_name;
  }

  // Group missions by operator
  const byOperator: Record<string, typeof missions> = {};
  for (const m of missions) {
    if (!m.assigned_to) continue;
    if (!byOperator[m.assigned_to]) byOperator[m.assigned_to] = [];
    byOperator[m.assigned_to].push(m);
  }

  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  const conflicts: CalendarConflict[] = [];
  const seen = new Set<string>();

  for (const operatorId of Object.keys(byOperator)) {
    const operatorMissions = byOperator[operatorId];
    if (operatorMissions.length < 2) continue;

    // Compare each pair
    for (let i = 0; i < operatorMissions.length; i++) {
      for (let j = i + 1; j < operatorMissions.length; j++) {
        const m1 = operatorMissions[i];
        const m2 = operatorMissions[j];

        const t1 = new Date(m1.scheduled_at).getTime();
        const t2 = new Date(m2.scheduled_at).getTime();
        const diff = Math.abs(t1 - t2);

        if (diff < TWO_HOURS_MS) {
          // Avoid duplicate pairs
          const pairKey = [m1.id, m2.id].sort().join(":");
          if (seen.has(pairKey)) continue;
          seen.add(pairKey);

          const operatorName = operatorMap[operatorId] ?? "Operateur inconnu";
          const conflictDate = new Date(m1.scheduled_at)
            .toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            });

          conflicts.push({
            mission1_id: m1.id,
            mission2_id: m2.id,
            operator_name: operatorName,
            operator_id: operatorId,
            date: conflictDate,
            details: `${operatorName} a 2 missions le ${conflictDate}`,
            mission1_type: m1.type as MissionType,
            mission2_type: m2.type as MissionType,
          });
        }
      }
    }
  }

  return conflicts;
}
