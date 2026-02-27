"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  type ActionResponse,
  successResponse,
  errorResponse,
} from "@/lib/action-response";
import type { IncidentCategory, IncidentResponseTemplate } from "@/types/database";

export async function getIncidentTemplates(
  category?: IncidentCategory
): Promise<IncidentResponseTemplate[]> {
  const profile = await requireProfile();
  const supabase = createClient();

  let query = supabase
    .from("incident_response_templates")
    .select("*")
    .eq("organisation_id", profile.organisation_id)
    .order("title");

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching incident templates:", error);
    return [];
  }

  return (data ?? []) as IncidentResponseTemplate[];
}

export async function createIncidentTemplate(data: {
  name: string;
  category?: string;
  content: string;
}): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile))
      return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;
    const supabase = createClient();

    const { data: created, error } = await supabase
      .from("incident_response_templates")
      .insert({
        organisation_id: profile.organisation_id,
        title: data.name.trim(),
        category: data.category || null,
        content: data.content.trim(),
      })
      .select("id")
      .single();

    if (error)
      return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/incidents");
    return successResponse("Modèle créé avec succès", { id: created.id });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la création du modèle"
    ) as ActionResponse<{ id: string }>;
  }
}

export async function updateIncidentTemplate(
  id: string,
  data: { name: string; category?: string; content: string }
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile))
      return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;
    const supabase = createClient();

    const { error } = await supabase
      .from("incident_response_templates")
      .update({
        title: data.name.trim(),
        category: data.category || null,
        content: data.content.trim(),
      })
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error)
      return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/incidents");
    return successResponse("Modèle mis à jour avec succès", { id });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la mise à jour du modèle"
    ) as ActionResponse<{ id: string }>;
  }
}

export async function deleteIncidentTemplate(
  id: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé");
    const supabase = createClient();

    const { error } = await supabase
      .from("incident_response_templates")
      .delete()
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath("/incidents");
    return successResponse("Modèle supprimé avec succès");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la suppression du modèle"
    );
  }
}
