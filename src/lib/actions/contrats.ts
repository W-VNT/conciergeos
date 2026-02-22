"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { contratSchema, type ContratFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";

export async function createContrat(data: ContratFormData): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = contratSchema.parse(data);
    const supabase = createClient();

    const { data: created, error } = await supabase.from("contrats").insert({
      organisation_id: profile.organisation_id,
      proprietaire_id: parsed.proprietaire_id,
      logement_id: parsed.logement_id || null,
      type: parsed.type,
      start_date: parsed.start_date,
      end_date: parsed.end_date,
      commission_rate: parsed.commission_rate,
      status: parsed.status,
      conditions: parsed.conditions || null,
    }).select("id").single();

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/contrats");
    return successResponse("Contrat créé avec succès", { id: created.id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la création du contrat") as ActionResponse<{ id: string }>;
  }
}

export async function updateContrat(id: string, data: ContratFormData): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = contratSchema.parse(data);
    const supabase = createClient();

    // Block update on signed contracts
    const { data: existing } = await supabase.from("contrats").select("status").eq("id", id).eq("organisation_id", profile.organisation_id).single();
    if (existing?.status === "SIGNE") return errorResponse("Un contrat signé ne peut pas être modifié") as ActionResponse<{ id: string }>;

    const { error } = await supabase
      .from("contrats")
      .update({
        proprietaire_id: parsed.proprietaire_id,
        logement_id: parsed.logement_id || null,
        type: parsed.type,
        start_date: parsed.start_date,
        end_date: parsed.end_date,
        commission_rate: parsed.commission_rate,
        status: parsed.status,
        conditions: parsed.conditions || null,
      })
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/contrats");
    revalidatePath(`/contrats/${id}`);
    return successResponse("Contrat mis à jour avec succès", { id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la mise à jour du contrat") as ActionResponse<{ id: string }>;
  }
}

export async function deleteContrat(id: string): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé");

    const supabase = createClient();
    const { error } = await supabase.from("contrats").delete().eq("id", id).eq("organisation_id", profile.organisation_id);
    if (error) return errorResponse(error.message);

    revalidatePath("/contrats");
    return successResponse("Contrat supprimé avec succès");
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la suppression du contrat");
  }
}

export async function markContratAsSigned(id: string) {
  const profile = await requireProfile();
  const supabase = createClient();

  const { error } = await supabase
    .from("contrats")
    .update({
      status: "SIGNE",
      pdf_downloaded_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organisation_id", profile.organisation_id)
    .is("pdf_downloaded_at", null); // Only set once (first download)

  if (error) throw new Error(error.message);
  revalidatePath(`/contrats/${id}`);
  revalidatePath("/contrats");
}
