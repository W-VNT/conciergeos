"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { missionTemplateSchema, type MissionTemplateFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import type { MissionTemplate } from "@/types/database";

export async function getMissionTemplates(): Promise<MissionTemplate[]> {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data } = await supabase
    .from("mission_templates")
    .select("*, logement:logements(id, name)")
    .eq("organisation_id", profile.organisation_id)
    .order("name");

  return (data ?? []) as MissionTemplate[];
}

export async function getMissionTemplate(
  id: string
): Promise<MissionTemplate | null> {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data } = await supabase
    .from("mission_templates")
    .select("*, logement:logements(id, name)")
    .eq("id", id)
    .eq("organisation_id", profile.organisation_id)
    .single();

  return data as MissionTemplate | null;
}

export async function createMissionTemplate(
  data: MissionTemplateFormData & { checklist: Array<{ label: string }> }
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile))
      return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = missionTemplateSchema.parse(data);
    const supabase = createClient();

    const { data: created, error } = await supabase
      .from("mission_templates")
      .insert({
        organisation_id: profile.organisation_id,
        name: parsed.name,
        type: parsed.type,
        logement_id: parsed.logement_id || null,
        description: parsed.description || null,
        estimated_duration_minutes: parsed.estimated_duration_minutes,
        checklist: data.checklist.filter((c) => c.label.trim()),
        priority: parsed.priority,
        notes: parsed.notes || null,
      })
      .select("id")
      .single();

    if (error)
      return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/missions/templates");
    return successResponse("Modèle créé avec succès", { id: created.id });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la création du modèle"
    ) as ActionResponse<{ id: string }>;
  }
}

export async function updateMissionTemplate(
  id: string,
  data: MissionTemplateFormData & { checklist: Array<{ label: string }> }
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile))
      return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = missionTemplateSchema.parse(data);
    const supabase = createClient();

    const { error } = await supabase
      .from("mission_templates")
      .update({
        name: parsed.name,
        type: parsed.type,
        logement_id: parsed.logement_id || null,
        description: parsed.description || null,
        estimated_duration_minutes: parsed.estimated_duration_minutes,
        checklist: data.checklist.filter((c) => c.label.trim()),
        priority: parsed.priority,
        notes: parsed.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error)
      return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/missions/templates");
    return successResponse("Modèle mis à jour avec succès", { id });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la mise à jour du modèle"
    ) as ActionResponse<{ id: string }>;
  }
}

export async function deleteMissionTemplate(
  id: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé");
    const supabase = createClient();

    const { error } = await supabase
      .from("mission_templates")
      .delete()
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath("/missions/templates");
    return successResponse("Modèle supprimé avec succès");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la suppression du modèle"
    );
  }
}

export async function createMissionFromTemplate(
  templateId: string,
  scheduledAt: string,
  assignedTo?: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile))
      return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const supabase = createClient();

    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from("mission_templates")
      .select("*")
      .eq("id", templateId)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (templateError || !template) {
      return errorResponse("Modèle non trouvé") as ActionResponse<{
        id: string;
      }>;
    }

    // If template has no logement_id, we need one from the caller
    // For now, allow null logement_id missions (or use template's)
    if (!template.logement_id) {
      return errorResponse(
        "Le modèle doit avoir un logement associé pour créer une mission"
      ) as ActionResponse<{ id: string }>;
    }

    const { data: created, error } = await supabase
      .from("missions")
      .insert({
        organisation_id: profile.organisation_id,
        logement_id: template.logement_id,
        type: template.type,
        priority: template.priority,
        status: "A_FAIRE",
        scheduled_at: scheduledAt,
        assigned_to: assignedTo || null,
        notes: template.notes || null,
      })
      .select("id")
      .single();

    if (error)
      return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/missions");
    return successResponse("Mission créée depuis le modèle", {
      id: created.id,
    });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la création de la mission"
    ) as ActionResponse<{ id: string }>;
  }
}
