"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { proprietaireSchema, type ProprietaireFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import { toTitleCase } from "@/lib/utils";

export async function createProprietaire(data: ProprietaireFormData): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = proprietaireSchema.parse(data);
    const supabase = createClient();

    const { data: created, error } = await supabase.from("proprietaires").insert({
      organisation_id: profile.organisation_id,
      full_name: toTitleCase(parsed.full_name),
      phone: parsed.phone || null,
      email: parsed.email || null,
      address_line1: parsed.address_line1 || null,
      postal_code: parsed.postal_code || null,
      city: parsed.city || null,
      statut_juridique: parsed.statut_juridique,
      siret: parsed.siret || null,
      notes: parsed.notes || null,
    }).select("id").single();

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/proprietaires");
    return successResponse("Propriétaire créé avec succès", { id: created.id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la création du propriétaire") as ActionResponse<{ id: string }>;
  }
}

export async function updateProprietaire(id: string, data: ProprietaireFormData): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = proprietaireSchema.parse(data);
    const supabase = createClient();

    const { error } = await supabase
      .from("proprietaires")
      .update({
        full_name: toTitleCase(parsed.full_name),
        phone: parsed.phone || null,
        email: parsed.email || null,
        address_line1: parsed.address_line1 || null,
        postal_code: parsed.postal_code || null,
        city: parsed.city || null,
        statut_juridique: parsed.statut_juridique,
        siret: parsed.siret || null,
        notes: parsed.notes || null,
      })
      .eq("id", id);

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/proprietaires");
    revalidatePath(`/proprietaires/${id}`);
    return successResponse("Propriétaire mis à jour avec succès", { id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la mise à jour du propriétaire") as ActionResponse<{ id: string }>;
  }
}

export async function deleteProprietaire(id: string): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé");

    const supabase = createClient();
    const { error } = await supabase.from("proprietaires").delete().eq("id", id);
    if (error) return errorResponse(error.message);

    revalidatePath("/proprietaires");
    return successResponse("Propriétaire supprimé avec succès");
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la suppression du propriétaire");
  }
}
