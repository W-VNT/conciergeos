"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import type { Profile, Mission } from "@/types/database";

export interface PlanningOperator {
  profile: Profile;
  missions: Mission[];
}

export interface PlanningData {
  operators: PlanningOperator[];
  unassigned: Mission[];
}

/**
 * Get all missions for a given week, grouped by operator
 */
export async function getPlanningData(weekStart: string): Promise<PlanningData> {
  const profile = await requireProfile();
  const supabase = createClient();

  // Calculate week end (Sunday)
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const weekStartISO = start.toISOString().split("T")[0];
  const weekEndISO = end.toISOString().split("T")[0];

  // Fetch all missions for the week
  const { data: missions, error } = await supabase
    .from("missions")
    .select("*, logement:logements(id, name, address_line1, city), assignee:profiles(id, full_name, role, email, organisation_id, created_at)")
    .eq("organisation_id", profile.organisation_id)
    .gte("scheduled_at", `${weekStartISO}T00:00:00`)
    .lt("scheduled_at", `${weekEndISO}T00:00:00`)
    .order("scheduled_at", { ascending: true });

  if (error || !missions) {
    return { operators: [], unassigned: [] };
  }

  // Fetch all operators in the organisation
  const { data: operators } = await supabase
    .from("profiles")
    .select("*")
    .eq("organisation_id", profile.organisation_id)
    .in("role", ["OPERATEUR", "ADMIN", "MANAGER"])
    .order("full_name");

  // Group missions by operator
  const operatorMap = new Map<string, { profile: Profile; missions: Mission[] }>();

  // Initialize all operators (even those with no missions)
  for (const op of operators ?? []) {
    operatorMap.set(op.id, { profile: op as Profile, missions: [] });
  }

  const unassigned: Mission[] = [];

  for (const mission of missions) {
    if (mission.assigned_to && operatorMap.has(mission.assigned_to)) {
      operatorMap.get(mission.assigned_to)!.missions.push(mission as Mission);
    } else if (mission.assigned_to) {
      // Assigned to someone not in our operator list - create entry
      const assignee = mission.assignee as { id: string; full_name: string; role: string; email: string | null; organisation_id: string; created_at: string } | null;
      if (assignee) {
        if (!operatorMap.has(mission.assigned_to)) {
          operatorMap.set(mission.assigned_to, {
            profile: assignee as unknown as Profile,
            missions: [],
          });
        }
        operatorMap.get(mission.assigned_to)!.missions.push(mission as Mission);
      } else {
        unassigned.push(mission as Mission);
      }
    } else {
      unassigned.push(mission as Mission);
    }
  }

  return {
    operators: Array.from(operatorMap.values()),
    unassigned,
  };
}

/**
 * Reassign a mission to a different operator
 */
export async function reassignMission(
  missionId: string,
  newOperatorId: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé");

    const supabase = createClient();

    // Verify operator belongs to the organisation
    const { data: operator, error: opError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", newOperatorId)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (opError || !operator) {
      return errorResponse("Opérateur non trouvé");
    }

    const { error } = await supabase
      .from("missions")
      .update({
        assigned_to: newOperatorId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", missionId)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath("/planning");
    revalidatePath("/missions");
    return successResponse(`Mission réassignée à ${operator.full_name}`);
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la réassignation"
    );
  }
}
