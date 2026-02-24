"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { missionRecurrenceSchema, type MissionRecurrenceFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import type { MissionRecurrence } from "@/types/database";

/**
 * Get all recurrences for an organisation, with logement name
 */
export async function getRecurrences(
  organisationId: string
): Promise<ActionResponse<MissionRecurrence[]>> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    const { data, error } = await supabase
      .from("mission_recurrences")
      .select("*, logement:logements(name), assignee:profiles(full_name)")
      .eq("organisation_id", profile.organisation_id)
      .order("created_at", { ascending: false });

    if (error) return errorResponse(error.message) as ActionResponse<MissionRecurrence[]>;

    return successResponse("Récurrences chargées", data as MissionRecurrence[]);
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors du chargement des récurrences"
    ) as ActionResponse<MissionRecurrence[]>;
  }
}

/**
 * Create a new recurrence
 */
export async function createRecurrence(
  data: MissionRecurrenceFormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = missionRecurrenceSchema.parse(data);
    const supabase = createClient();

    const { data: created, error } = await supabase
      .from("mission_recurrences")
      .insert({
        organisation_id: profile.organisation_id,
        logement_id: parsed.logement_id,
        type: parsed.type,
        frequency: parsed.frequency,
        day_of_week: parsed.frequency === "HEBDOMADAIRE" ? parsed.day_of_week : null,
        day_of_month: parsed.frequency === "MENSUEL" ? parsed.day_of_month : null,
        scheduled_time: parsed.scheduled_time,
        assigned_to: parsed.assigned_to || null,
        priority: parsed.priority,
        notes: parsed.notes || null,
        active: parsed.active,
      })
      .select("id")
      .single();

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/missions");
    return successResponse("Récurrence créée avec succès", { id: created.id });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la création de la récurrence"
    ) as ActionResponse<{ id: string }>;
  }
}

/**
 * Update an existing recurrence
 */
export async function updateRecurrence(
  id: string,
  data: MissionRecurrenceFormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = missionRecurrenceSchema.parse(data);
    const supabase = createClient();

    const { error } = await supabase
      .from("mission_recurrences")
      .update({
        logement_id: parsed.logement_id,
        type: parsed.type,
        frequency: parsed.frequency,
        day_of_week: parsed.frequency === "HEBDOMADAIRE" ? parsed.day_of_week : null,
        day_of_month: parsed.frequency === "MENSUEL" ? parsed.day_of_month : null,
        scheduled_time: parsed.scheduled_time,
        assigned_to: parsed.assigned_to || null,
        priority: parsed.priority,
        notes: parsed.notes || null,
        active: parsed.active,
      })
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/missions");
    return successResponse("Récurrence mise à jour avec succès", { id });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la mise à jour de la récurrence"
    ) as ActionResponse<{ id: string }>;
  }
}

/**
 * Delete a recurrence
 */
export async function deleteRecurrence(id: string): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé");

    const supabase = createClient();

    const { error } = await supabase
      .from("mission_recurrences")
      .delete()
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath("/missions");
    return successResponse("Récurrence supprimée avec succès");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la suppression de la récurrence"
    );
  }
}

/**
 * Toggle a recurrence active/inactive
 */
export async function toggleRecurrence(
  id: string,
  active: boolean
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé");

    const supabase = createClient();

    const { error } = await supabase
      .from("mission_recurrences")
      .update({ active })
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath("/missions");
    return successResponse(active ? "Récurrence activée" : "Récurrence désactivée");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la mise à jour de la récurrence"
    );
  }
}
