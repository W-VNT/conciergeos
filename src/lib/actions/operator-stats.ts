"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export interface OperatorStat {
  operator_id: string;
  operator_name: string;
  missions_completed: number;
  avg_time_minutes: number;
  missions_late: number;
  missions_pending: number;
  late_rate: number; // percentage 0-100
}

/**
 * Compute per-operator statistics for the organisation:
 *  - missions_completed: count of TERMINE missions
 *  - avg_time_minutes: average time_spent_minutes on completed missions
 *  - missions_late: count of missions completed after scheduled_at
 *  - missions_pending: count of A_FAIRE/EN_COURS missions
 *  - late_rate: percentage of late completions over all completions
 */
export async function getOperatorStats(
  organisationId: string
): Promise<OperatorStat[]> {
  const profile = await requireProfile();
  if (profile.organisation_id !== organisationId) throw new Error("Non autorisé");
  const supabase = await createClient();

  // Get all operators (OPERATEUR role)
  const { data: operators } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organisation_id", organisationId)
    .eq("role", "OPERATEUR")
    .order("full_name");

  if (!operators || operators.length === 0) return [];

  const operatorIds = operators.map((o) => o.id);

  // Fetch all missions assigned to these operators in one query
  const { data: missions } = await supabase
    .from("missions")
    .select("id, assigned_to, status, scheduled_at, completed_at, time_spent_minutes")
    .eq("organisation_id", organisationId)
    .in("assigned_to", operatorIds);

  const allMissions = missions ?? [];

  // Build stats per operator
  const results: OperatorStat[] = operators.map((op) => {
    const opMissions = allMissions.filter((m) => m.assigned_to === op.id);
    const completed = opMissions.filter((m) => m.status === "TERMINE");
    const pending = opMissions.filter((m) =>
      m.status === "A_FAIRE" || m.status === "EN_COURS"
    );

    // Late = completed_at > scheduled_at
    const late = completed.filter((m) => {
      if (!m.completed_at || !m.scheduled_at) return false;
      return new Date(m.completed_at) > new Date(m.scheduled_at);
    });

    // Average time spent
    const timesSpent = completed
      .map((m) => m.time_spent_minutes)
      .filter((t): t is number => t != null && t > 0);
    const avgTime =
      timesSpent.length > 0
        ? Math.round(timesSpent.reduce((a, b) => a + b, 0) / timesSpent.length)
        : 0;

    const lateRate =
      completed.length > 0
        ? Math.round((late.length / completed.length) * 100)
        : 0;

    return {
      operator_id: op.id,
      operator_name: op.full_name,
      missions_completed: completed.length,
      avg_time_minutes: avgTime,
      missions_late: late.length,
      missions_pending: pending.length,
      late_rate: lateRate,
    };
  });

  return results;
}
