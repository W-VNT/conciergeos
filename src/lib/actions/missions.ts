"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import {
  missionSchema,
  type MissionFormData,
  bulkAssignmentSchema,
  autoAssignmentSchema,
  operatorCapabilitiesSchema
} from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import { sendPushToUser } from "@/lib/push";
import type {
  MissionType,
  Profile,
  AutoAssignmentResult,
  OperatorCapabilities
} from "@/types/database";

export async function createMission(data: MissionFormData): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    const parsed = missionSchema.parse(data);
    const supabase = createClient();

    // Combine date and time
    const scheduled_at = `${parsed.scheduled_date}T${parsed.scheduled_time}:00`;

    const { data: created, error } = await supabase.from("missions").insert({
      organisation_id: profile.organisation_id,
      logement_id: parsed.logement_id,
      assigned_to: parsed.assigned_to || null,
      type: parsed.type,
      status: parsed.status,
      priority: parsed.priority,
      scheduled_at,
      time_spent_minutes: parsed.time_spent_minutes || null,
      notes: parsed.notes || null,
    }).select("id").single();

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/missions");
    return successResponse("Mission créée avec succès", { id: created.id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la création de la mission") as ActionResponse<{ id: string }>;
  }
}

export async function updateMission(id: string, data: MissionFormData): Promise<ActionResponse<{ id: string }>> {
  try {
    await requireProfile();
    const parsed = missionSchema.parse(data);
    const supabase = createClient();

    // Combine date and time
    const scheduled_at = `${parsed.scheduled_date}T${parsed.scheduled_time}:00`;

    const updateData: Record<string, unknown> = {
      logement_id: parsed.logement_id,
      assigned_to: parsed.assigned_to || null,
      type: parsed.type,
      status: parsed.status,
      priority: parsed.priority,
      scheduled_at,
      time_spent_minutes: parsed.time_spent_minutes || null,
      notes: parsed.notes || null,
    };

    if (parsed.status === "TERMINE") {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("missions")
      .update(updateData)
      .eq("id", id);

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/missions");
    revalidatePath(`/missions/${id}`);
    return successResponse("Mission mise à jour avec succès", { id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la mise à jour de la mission") as ActionResponse<{ id: string }>;
  }
}

export async function startMission(id: string) {
  await requireProfile();
  const supabase = createClient();

  const { error } = await supabase
    .from("missions")
    .update({ status: "EN_COURS" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/ma-journee");
  revalidatePath("/missions");
  revalidatePath("/dashboard");
}

export async function completeMission(id: string) {
  await requireProfile();
  const supabase = createClient();

  const { error } = await supabase
    .from("missions")
    .update({
      status: "TERMINE",
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/ma-journee");
  revalidatePath("/missions");
  revalidatePath("/dashboard");
}

export async function deleteMission(id: string): Promise<ActionResponse> {
  try {
    await requireProfile();
    const supabase = createClient();

    const { error } = await supabase.from("missions").delete().eq("id", id);
    if (error) return errorResponse(error.message);

    revalidatePath("/missions");
    revalidatePath("/dashboard");
    return successResponse("Mission supprimée avec succès");
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la suppression de la mission");
  }
}

/**
 * Bulk complete missions
 */
export async function bulkCompleteMissions(
  missionIds: string[]
): Promise<ActionResponse<{ count: number }>> {
  try {
    await requireProfile();
    const supabase = createClient();

    const { error } = await supabase
      .from("missions")
      .update({
        status: "TERMINE",
        completed_at: new Date().toISOString(),
      })
      .in("id", missionIds);

    if (error) {
      return errorResponse(error.message) as ActionResponse<{ count: number }>;
    }

    revalidatePath("/missions");
    revalidatePath("/dashboard");
    return successResponse(
      `${missionIds.length} mission(s) terminée(s)`,
      { count: missionIds.length }
    );
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la complétion des missions"
    ) as ActionResponse<{ count: number }>;
  }
}

/**
 * Bulk delete missions
 */
export async function bulkDeleteMissions(
  missionIds: string[]
): Promise<ActionResponse<{ count: number }>> {
  try {
    await requireProfile();
    const supabase = createClient();

    const { error } = await supabase
      .from("missions")
      .delete()
      .in("id", missionIds);

    if (error) {
      return errorResponse(error.message) as ActionResponse<{ count: number }>;
    }

    revalidatePath("/missions");
    revalidatePath("/dashboard");
    return successResponse(
      `${missionIds.length} mission(s) supprimée(s)`,
      { count: missionIds.length }
    );
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la suppression des missions"
    ) as ActionResponse<{ count: number }>;
  }
}

// ============================================================
// Bulk Assignment & Auto-Assignment Actions
// ============================================================

/**
 * Assign multiple missions to a single operator
 */
export async function bulkAssignMissions(data: {
  mission_ids: string[];
  operator_id: string;
  organisation_id: string;
}): Promise<ActionResponse<{ count: number }>> {
  try {
    await requireProfile();
    const validated = bulkAssignmentSchema.parse(data);
    const supabase = createClient();

    // Verify operator exists and belongs to organisation
    const { data: operator, error: opError } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", validated.operator_id)
      .eq("organisation_id", validated.organisation_id)
      .in("role", ["OPERATEUR", "ADMIN"])
      .single();

    if (opError || !operator) {
      return errorResponse("Opérateur non trouvé") as ActionResponse<{ count: number }>;
    }

    // Bulk update missions
    const { error: updateError } = await supabase
      .from("missions")
      .update({
        assigned_to: validated.operator_id,
        status: "A_FAIRE",
        updated_at: new Date().toISOString(),
      })
      .in("id", validated.mission_ids)
      .eq("organisation_id", validated.organisation_id);

    if (updateError) {
      return errorResponse(updateError.message) as ActionResponse<{ count: number }>;
    }

    // Send push notification to assigned operator (non-blocking)
    sendPushToUser(validated.operator_id, {
      title: "Nouvelle mission assignée",
      body: `${validated.mission_ids.length} mission(s) vous ont été assignée(s)`,
      url: "/missions",
    }).catch((err) => console.error("[push] Failed to send push:", err));

    revalidatePath("/missions");
    return successResponse(
      `${validated.mission_ids.length} mission(s) assignée(s) à ${operator.full_name}`,
      { count: validated.mission_ids.length }
    );
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de l'assignation en masse"
    ) as ActionResponse<{ count: number }>;
  }
}

/**
 * Get operators matching specific mission type and zone
 */
export async function getMatchingOperators(params: {
  mission_type: MissionType;
  zone?: string;
  organisation_id: string;
}): Promise<Array<{ id: string; full_name: string; email: string; operator_capabilities: OperatorCapabilities | null }>> {
  try {
    const supabase = createClient();

    let query = supabase
      .from("profiles")
      .select("id, full_name, email, operator_capabilities")
      .eq("role", "OPERATEUR")
      .eq("organisation_id", params.organisation_id);

    // Filter by mission type using JSONB contains
    if (params.mission_type) {
      query = query.contains("operator_capabilities", {
        mission_types: [params.mission_type]
      });
    }

    // Filter by zone if specified
    if (params.zone) {
      query = query.contains("operator_capabilities", {
        zones: [params.zone]
      });
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching matching operators:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Error in getMatchingOperators:", err);
    return [];
  }
}

/**
 * Auto-assign missions based on operator capabilities
 */
export async function autoAssignMissions(data: {
  mission_ids: string[];
  organisation_id: string;
}): Promise<AutoAssignmentResult> {
  try {
    await requireProfile();
    const validated = autoAssignmentSchema.parse(data);
    const supabase = createClient();

    const result: AutoAssignmentResult = {
      assigned: [],
      unassigned: [],
    };

    // Fetch all missions to assign
    const { data: missions, error: missionsError } = await supabase
      .from("missions")
      .select("id, type, logement:logements(code_postal)")
      .in("id", validated.mission_ids)
      .eq("organisation_id", validated.organisation_id);

    if (missionsError || !missions) {
      console.error("Error fetching missions:", missionsError);
      return result;
    }

    // For each mission, find a compatible operator
    for (const mission of missions) {
      // Handle both array and object responses from Supabase join
      const logement = Array.isArray(mission.logement) ? mission.logement[0] : mission.logement;
      const zone = logement?.code_postal?.substring(0, 5);

      // Get compatible operators
      const compatibleOperators = await getMatchingOperators({
        mission_type: mission.type,
        zone: zone,
        organisation_id: validated.organisation_id,
      });

      if (compatibleOperators.length === 0) {
        result.unassigned.push({
          mission_id: mission.id,
          reason: zone
            ? `Aucun opérateur disponible pour ${mission.type} dans la zone ${zone}`
            : `Aucun opérateur disponible pour ${mission.type}`,
        });
        continue;
      }

      // Simple algorithm: take the first available operator
      // (Future: implement load balancing)
      const selectedOperator = compatibleOperators[0];

      // Assign the mission
      const { error: assignError } = await supabase
        .from("missions")
        .update({
          assigned_to: selectedOperator.id,
          status: "A_FAIRE",
          updated_at: new Date().toISOString(),
        })
        .eq("id", mission.id);

      if (assignError) {
        result.unassigned.push({
          mission_id: mission.id,
          reason: "Erreur technique lors de l'assignation",
        });
      } else {
        result.assigned.push({
          mission_id: mission.id,
          operator_id: selectedOperator.id,
          operator_name: selectedOperator.full_name,
        });
      }
    }

    revalidatePath("/missions");
    return result;
  } catch (err) {
    console.error("Error in autoAssignMissions:", err);
    return {
      assigned: [],
      unassigned: [],
    };
  }
}

/**
 * Update operator capabilities for auto-assignment
 */
export async function updateOperatorCapabilities(
  operatorId: string,
  capabilities: OperatorCapabilities
): Promise<ActionResponse> {
  try {
    await requireProfile();
    const validated = operatorCapabilitiesSchema.parse(capabilities);
    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({ operator_capabilities: validated })
      .eq("id", operatorId)
      .eq("role", "OPERATEUR");

    if (error) {
      return errorResponse(error.message);
    }

    revalidatePath("/team");
    revalidatePath(`/team/${operatorId}`);
    revalidatePath("/organisation");
    return successResponse("Compétences mises à jour avec succès");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la mise à jour des compétences"
    );
  }
}
