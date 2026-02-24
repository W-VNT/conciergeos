"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { slaConfigSchema, type SlaConfigFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import type { SlaConfig, Mission, Incident } from "@/types/database";

/**
 * Get all SLA configs for an organisation
 */
export async function getSlaConfigs(
  organisationId: string
): Promise<ActionResponse<SlaConfig[]>> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    const { data, error } = await supabase
      .from("sla_configs")
      .select("*")
      .eq("organisation_id", profile.organisation_id)
      .order("entity_type")
      .order("subtype");

    if (error) return errorResponse(error.message) as ActionResponse<SlaConfig[]>;

    return successResponse("SLA chargés", data as SlaConfig[]);
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors du chargement des SLA"
    ) as ActionResponse<SlaConfig[]>;
  }
}

/**
 * Upsert a SLA config (since org+entity_type+subtype is unique)
 */
export async function upsertSlaConfig(
  data: SlaConfigFormData
): Promise<ActionResponse<SlaConfig>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<SlaConfig>;

    const parsed = slaConfigSchema.parse(data);
    const supabase = createClient();

    const { data: upserted, error } = await supabase
      .from("sla_configs")
      .upsert(
        {
          organisation_id: profile.organisation_id,
          entity_type: parsed.entity_type,
          subtype: parsed.subtype,
          max_hours: parsed.max_hours,
        },
        { onConflict: "organisation_id,entity_type,subtype" }
      )
      .select("*")
      .single();

    if (error) return errorResponse(error.message) as ActionResponse<SlaConfig>;

    revalidatePath("/missions");
    revalidatePath("/incidents");
    return successResponse("SLA mis à jour", upserted as SlaConfig);
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la mise à jour du SLA"
    ) as ActionResponse<SlaConfig>;
  }
}

/**
 * Delete a SLA config
 */
export async function deleteSlaConfig(id: string): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé");

    const supabase = createClient();

    const { error } = await supabase
      .from("sla_configs")
      .delete()
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath("/missions");
    revalidatePath("/incidents");
    return successResponse("SLA supprimé");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la suppression du SLA"
    );
  }
}

/**
 * Check the SLA status of a mission.
 * Returns whether the mission is overdue, how many hours overdue, and the max allowed hours.
 */
export async function checkMissionSla(
  mission: Pick<Mission, "type" | "status" | "scheduled_at" | "completed_at">,
  slaConfigs: SlaConfig[]
): Promise<{
  isOverdue: boolean;
  hoursOverdue: number | null;
  hoursElapsed: number;
  maxHours: number | null;
  percentElapsed: number | null;
}> {
  // Find SLA config for this mission type
  const config = slaConfigs.find(
    (c) => c.entity_type === "MISSION" && c.subtype === mission.type
  );

  if (!config) {
    return {
      isOverdue: false,
      hoursOverdue: null,
      hoursElapsed: 0,
      maxHours: null,
      percentElapsed: null,
    };
  }

  const scheduledAt = new Date(mission.scheduled_at);
  const now = mission.completed_at ? new Date(mission.completed_at) : new Date();
  const hoursElapsed = Math.max(
    0,
    (now.getTime() - scheduledAt.getTime()) / (1000 * 60 * 60)
  );
  const isOverdue = hoursElapsed > config.max_hours;
  const hoursOverdue = isOverdue
    ? Math.round((hoursElapsed - config.max_hours) * 10) / 10
    : null;
  const percentElapsed = (hoursElapsed / config.max_hours) * 100;

  return {
    isOverdue,
    hoursOverdue,
    hoursElapsed: Math.round(hoursElapsed * 10) / 10,
    maxHours: config.max_hours,
    percentElapsed: Math.round(percentElapsed),
  };
}

/**
 * Check the SLA status of an incident based on its severity.
 * Looks up sla_configs where entity_type='INCIDENT' and subtype=incident.severity.
 */
export async function checkIncidentSla(incident: {
  id: string;
  organisation_id: string;
  severity: string;
  opened_at: string;
  status: string;
  resolved_at?: string | null;
}): Promise<{
  isOverdue: boolean;
  hoursOverdue: number | null;
  hoursElapsed: number;
  maxHours: number | null;
}> {
  const supabase = createClient();

  const { data: slaConfig } = await supabase
    .from("sla_configs")
    .select("max_hours")
    .eq("organisation_id", incident.organisation_id)
    .eq("entity_type", "INCIDENT")
    .eq("subtype", incident.severity)
    .single();

  if (!slaConfig) {
    return { isOverdue: false, hoursOverdue: null, hoursElapsed: 0, maxHours: null };
  }

  const openedAt = new Date(incident.opened_at).getTime();
  const isResolved = incident.status === "RESOLU" || incident.status === "CLOS";
  const endTime = isResolved && incident.resolved_at
    ? new Date(incident.resolved_at).getTime()
    : Date.now();

  const hoursElapsed = Math.max(0, (endTime - openedAt) / (1000 * 60 * 60));
  const maxHours = slaConfig.max_hours;
  const isOverdue = hoursElapsed > maxHours;

  return {
    isOverdue,
    hoursOverdue: isOverdue ? Math.round((hoursElapsed - maxHours) * 10) / 10 : null,
    hoursElapsed: Math.round(hoursElapsed * 10) / 10,
    maxHours,
  };
}
