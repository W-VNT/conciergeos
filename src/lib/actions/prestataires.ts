"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { prestataireSchema, type PrestataireFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import { z } from "zod";

export async function createPrestataire(data: PrestataireFormData): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = prestataireSchema.parse(data);
    const supabase = createClient();

    const { data: created, error } = await supabase.from("prestataires").insert({
      organisation_id: profile.organisation_id,
      full_name: parsed.full_name,
      specialty: parsed.specialty,
      statut_juridique: parsed.statut_juridique,
      siret: parsed.siret || null,
      phone: parsed.phone || null,
      email: parsed.email || null,
      address_line1: parsed.address_line1 || null,
      postal_code: parsed.postal_code || null,
      city: parsed.city || null,
      zone: parsed.zone || null,
      hourly_rate: parsed.hourly_rate || null,
      reliability_score: parsed.reliability_score || null,
      notes: parsed.notes || null,
    }).select("id").single();

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/prestataires");
    return successResponse("Prestataire créé avec succès", { id: created.id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la création du prestataire") as ActionResponse<{ id: string }>;
  }
}

export async function updatePrestataire(id: string, data: PrestataireFormData): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = prestataireSchema.parse(data);
    const supabase = createClient();

    const { error } = await supabase
      .from("prestataires")
      .update({
        full_name: parsed.full_name,
        specialty: parsed.specialty,
        statut_juridique: parsed.statut_juridique,
        siret: parsed.siret || null,
        phone: parsed.phone || null,
        email: parsed.email || null,
        address_line1: parsed.address_line1 || null,
        postal_code: parsed.postal_code || null,
        city: parsed.city || null,
        zone: parsed.zone || null,
        hourly_rate: parsed.hourly_rate || null,
        reliability_score: parsed.reliability_score || null,
        notes: parsed.notes || null,
      })
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/prestataires");
    revalidatePath(`/prestataires/${id}`);
    return successResponse("Prestataire mis à jour avec succès", { id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la mise à jour du prestataire") as ActionResponse<{ id: string }>;
  }
}

export async function deletePrestataire(id: string): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé");

    const supabase = createClient();
    const { error } = await supabase.from("prestataires").delete().eq("id", id).eq("organisation_id", profile.organisation_id);
    if (error) return errorResponse(error.message);

    revalidatePath("/prestataires");
    return successResponse("Prestataire supprimé avec succès");
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la suppression du prestataire");
  }
}

export async function bulkDeletePrestataires(prestataireIds: string[]): Promise<ActionResponse<{ count: number }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ count: number }>;
    const validatedIds = z.array(z.string().uuid()).min(1).max(100).parse(prestataireIds);

    const supabase = createClient();

    const { error, count } = await supabase
      .from("prestataires")
      .delete({ count: "exact" })
      .in("id", validatedIds)
      .eq("organisation_id", profile.organisation_id);

    if (error) {
      console.error("Bulk delete prestataires error:", error);
      return errorResponse("Erreur lors de la suppression") as ActionResponse<{ count: number }>;
    }

    revalidatePath("/prestataires");

    return successResponse(
      `${count} prestataire${count && count > 1 ? "s" : ""} supprimé${count && count > 1 ? "s" : ""} avec succès`,
      { count: count || 0 }
    );
  } catch (err) {
    console.error("Bulk delete error:", err);
    return errorResponse((err as Error).message ?? "Erreur lors de la suppression") as ActionResponse<{ count: number }>;
  }
}
