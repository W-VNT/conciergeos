"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { z } from "zod";
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
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;
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
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;
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

    if (parsed.status === "EN_COURS") {
      updateData.started_at = new Date().toISOString();
      updateData.completed_at = null;
    } else if (parsed.status === "TERMINE") {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = null;
    }

    const { error } = await supabase
      .from("missions")
      .update(updateData)
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/missions");
    revalidatePath(`/missions/${id}`);
    return successResponse("Mission mise à jour avec succès", { id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la mise à jour de la mission") as ActionResponse<{ id: string }>;
  }
}

export async function startMission(id: string, coords?: { lat: number; lng: number }) {
  const profile = await requireProfile();
  const supabase = createClient();

  // Check dependency: if depends_on_mission_id is set, verify dependency is TERMINE
  const { data: mission, error: fetchError } = await supabase
    .from("missions")
    .select("depends_on_mission_id, assigned_to")
    .eq("id", id)
    .eq("organisation_id", profile.organisation_id)
    .single();

  if (fetchError || !mission) throw new Error(fetchError?.message ?? "Mission introuvable");

  // Verify caller is admin/manager or the assigned operator
  if (!isAdminOrManager(profile) && mission.assigned_to !== profile.id) {
    throw new Error("Non autorisé : vous n'êtes pas assigné à cette mission");
  }

  if (mission.depends_on_mission_id) {
    const { data: dependency } = await supabase
      .from("missions")
      .select("status")
      .eq("id", mission.depends_on_mission_id)
      .single();

    if (dependency && dependency.status !== "TERMINE") {
      throw new Error("La mission dépendante n'est pas encore terminée");
    }
  }

  const updateData: Record<string, unknown> = {
    status: "EN_COURS",
    completed_at: null,
    started_at: new Date().toISOString(),
  };

  if (coords) {
    updateData.check_in_lat = coords.lat;
    updateData.check_in_lng = coords.lng;
  }

  const { error } = await supabase
    .from("missions")
    .update(updateData)
    .eq("id", id)
    .eq("status", "A_FAIRE")
    .eq("organisation_id", profile.organisation_id);

  if (error) throw new Error(error.message);
  revalidatePath("/ma-journee");
  revalidatePath("/missions");
  revalidatePath("/dashboard");
}

export async function completeMission(id: string, coords?: { lat: number; lng: number }) {
  const profile = await requireProfile();
  const supabase = createClient();

  // Fetch the mission first to read started_at for time calculation
  const { data: mission, error: fetchError } = await supabase
    .from("missions")
    .select("started_at, assigned_to")
    .eq("id", id)
    .eq("organisation_id", profile.organisation_id)
    .single();

  if (fetchError || !mission) throw new Error(fetchError?.message ?? "Mission introuvable");

  // Verify caller is admin/manager or the assigned operator
  if (!isAdminOrManager(profile) && mission.assigned_to !== profile.id) {
    throw new Error("Non autorisé : vous n'êtes pas assigné à cette mission");
  }

  const now = new Date();
  const updateData: Record<string, unknown> = {
    status: "TERMINE",
    completed_at: now.toISOString(),
  };

  // Calculate time_spent_minutes if the mission was started (has started_at)
  if (mission?.started_at) {
    updateData.time_spent_minutes = Math.max(0, Math.round(
      (now.getTime() - new Date(mission.started_at).getTime()) / 60000
    ));
  }

  if (coords) {
    updateData.check_out_lat = coords.lat;
    updateData.check_out_lng = coords.lng;
  }

  const { error } = await supabase
    .from("missions")
    .update(updateData)
    .eq("id", id)
    .in("status", ["EN_COURS", "A_FAIRE"])
    .eq("organisation_id", profile.organisation_id);

  if (error) throw new Error(error.message);
  revalidatePath("/ma-journee");
  revalidatePath("/missions");
  revalidatePath("/dashboard");
}

export async function deleteMission(id: string): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé");
    const supabase = createClient();

    const { error } = await supabase.from("missions").delete().eq("id", id).eq("organisation_id", profile.organisation_id);
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
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé") as ActionResponse<{ count: number }>;
    const validatedIds = z.array(z.string().uuid()).min(1).max(100).parse(missionIds);
    const supabase = createClient();

    const { error } = await supabase
      .from("missions")
      .update({
        status: "TERMINE",
        completed_at: new Date().toISOString(),
      })
      .in("id", validatedIds)
      .eq("organisation_id", profile.organisation_id);

    if (error) {
      return errorResponse(error.message) as ActionResponse<{ count: number }>;
    }

    revalidatePath("/missions");
    revalidatePath("/dashboard");
    return successResponse(
      `${validatedIds.length} mission(s) terminée(s)`,
      { count: validatedIds.length }
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
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé") as ActionResponse<{ count: number }>;
    const validatedIds = z.array(z.string().uuid()).min(1).max(100).parse(missionIds);
    const supabase = createClient();

    const { error } = await supabase
      .from("missions")
      .delete()
      .in("id", validatedIds)
      .eq("organisation_id", profile.organisation_id);

    if (error) {
      return errorResponse(error.message) as ActionResponse<{ count: number }>;
    }

    revalidatePath("/missions");
    revalidatePath("/dashboard");
    return successResponse(
      `${validatedIds.length} mission(s) supprimée(s)`,
      { count: validatedIds.length }
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
}): Promise<ActionResponse<{ count: number }>> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé") as ActionResponse<{ count: number }>;
    const validated = bulkAssignmentSchema.parse(data);
    const supabase = createClient();

    // Verify operator exists and belongs to organisation
    const { data: operator, error: opError } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", validated.operator_id)
      .eq("organisation_id", profile.organisation_id)
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
      .eq("organisation_id", profile.organisation_id);

    if (updateError) {
      return errorResponse(updateError.message) as ActionResponse<{ count: number }>;
    }

    // Fetch mission types for push notification content
    const { data: assignedMissions } = await supabase
      .from("missions")
      .select("id, type")
      .in("id", validated.mission_ids)
      .eq("organisation_id", profile.organisation_id);

    const TYPE_LABELS: Record<string, string> = {
      CHECKIN: "Check-in",
      CHECKOUT: "Check-out",
      MENAGE: "Ménage",
      INTERVENTION: "Intervention",
      URGENCE: "Urgence",
    };

    const typeCounts = (assignedMissions || []).reduce<Record<string, number>>((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1;
      return acc;
    }, {});

    const typeSummary = Object.entries(typeCounts)
      .map(([type, count]) => `${count} ${TYPE_LABELS[type] || type}`)
      .join(", ");

    const count = validated.mission_ids.length;
    const pushTitle = count === 1
      ? `Mission assignée : ${typeSummary}`
      : `${count} missions assignées`;
    const pushBody = count === 1
      ? "Une nouvelle mission vous a été assignée"
      : typeSummary;

    // Send push notification to assigned operator (non-blocking)
    sendPushToUser(validated.operator_id, {
      title: pushTitle,
      body: pushBody,
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
}): Promise<Array<{ id: string; full_name: string; email: string; operator_capabilities: OperatorCapabilities | null }>> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return [];
    const supabase = createClient();

    let query = supabase
      .from("profiles")
      .select("id, full_name, email, operator_capabilities")
      .eq("role", "OPERATEUR")
      .eq("organisation_id", profile.organisation_id);

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
}): Promise<AutoAssignmentResult> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return { assigned: [], unassigned: [] };
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
      .eq("organisation_id", profile.organisation_id);

    if (missionsError || !missions) {
      console.error("Error fetching missions:", missionsError);
      return result;
    }

    // Fetch all operators once instead of per-mission (N+1 fix)
    const { data: allOperators } = await supabase
      .from("profiles")
      .select("id, full_name, email, operator_capabilities")
      .eq("role", "OPERATEUR")
      .eq("organisation_id", profile.organisation_id);

    const operators = allOperators || [];

    // Match operators in-memory and collect assignments
    const assignUpdates: { id: string; operator_id: string; operator_name: string }[] = [];

    for (const mission of missions) {
      const logement = Array.isArray(mission.logement) ? mission.logement[0] : mission.logement;
      const zone = logement?.code_postal?.substring(0, 5);

      // Filter operators in-memory
      const compatible = operators.filter((op) => {
        const caps = op.operator_capabilities as OperatorCapabilities | null;
        if (!caps) return false;
        if (mission.type && caps.mission_types && !caps.mission_types.includes(mission.type)) return false;
        if (zone && caps.zones && caps.zones.length > 0 && !caps.zones.includes(zone)) return false;
        return true;
      });

      if (compatible.length === 0) {
        result.unassigned.push({
          mission_id: mission.id,
          reason: zone
            ? `Aucun opérateur disponible pour ${mission.type} dans la zone ${zone}`
            : `Aucun opérateur disponible pour ${mission.type}`,
        });
        continue;
      }

      const selectedOperator = compatible[0];
      assignUpdates.push({
        id: mission.id,
        operator_id: selectedOperator.id,
        operator_name: selectedOperator.full_name,
      });
    }

    // Batch update: group by operator to minimize queries
    const byOperator = assignUpdates.reduce<Record<string, string[]>>((acc, u) => {
      (acc[u.operator_id] ??= []).push(u.id);
      return acc;
    }, {});

    const now = new Date().toISOString();
    for (const [operatorId, missionIds] of Object.entries(byOperator)) {
      const { error: assignError } = await supabase
        .from("missions")
        .update({
          assigned_to: operatorId,
          status: "A_FAIRE",
          updated_at: now,
        })
        .in("id", missionIds)
        .eq("organisation_id", profile.organisation_id);

      if (assignError) {
        missionIds.forEach((mid) =>
          result.unassigned.push({ mission_id: mid, reason: "Erreur technique lors de l'assignation" })
        );
      } else {
        assignUpdates
          .filter((u) => u.operator_id === operatorId)
          .forEach((u) =>
            result.assigned.push({ mission_id: u.id, operator_id: u.operator_id, operator_name: u.operator_name })
          );
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
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé");
    const validated = operatorCapabilitiesSchema.parse(capabilities);
    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({ operator_capabilities: validated })
      .eq("id", operatorId)
      .eq("role", "OPERATEUR")
      .eq("organisation_id", profile.organisation_id);

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
