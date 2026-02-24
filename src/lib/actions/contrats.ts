"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { contratSchema, type ContratFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import { createContratVersion } from "@/lib/actions/contrat-versions";

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
      auto_renew: parsed.auto_renew ?? false,
      renewal_duration_months: parsed.renewal_duration_months ?? 12,
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
    if (!existing) return errorResponse("Contrat non trouvé") as ActionResponse<{ id: string }>;
    if (existing.status === "SIGNE") return errorResponse("Un contrat signé ne peut pas être modifié") as ActionResponse<{ id: string }>;

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
        auto_renew: parsed.auto_renew ?? false,
        renewal_duration_months: parsed.renewal_duration_months ?? 12,
      })
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    // CO8: Auto-create version snapshot after update
    const versionContent = {
      proprietaire_id: parsed.proprietaire_id,
      logement_id: parsed.logement_id || null,
      type: parsed.type,
      start_date: parsed.start_date,
      end_date: parsed.end_date,
      commission_rate: parsed.commission_rate,
      status: parsed.status,
      conditions: parsed.conditions || null,
      auto_renew: parsed.auto_renew ?? false,
      renewal_duration_months: parsed.renewal_duration_months ?? 12,
    };

    // Determine what changed for the summary
    const changes: string[] = [];
    if (existing.status !== parsed.status) changes.push(`Statut: ${parsed.status}`);
    changes.push("Contrat mis \u00e0 jour");

    await createContratVersion(id, versionContent, changes[0]);

    revalidatePath("/contrats");
    revalidatePath(`/contrats/${id}`);
    return successResponse("Contrat mis \u00e0 jour avec succ\u00e8s", { id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la mise \u00e0 jour du contrat") as ActionResponse<{ id: string }>;
  }
}

export async function deleteContrat(id: string): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé");

    const supabase = createClient();

    // Vérifier que le contrat n'est pas signé avant suppression
    const { data: existing } = await supabase.from("contrats").select("status").eq("id", id).eq("organisation_id", profile.organisation_id).single();
    if (!existing) return errorResponse("Contrat non trouvé");
    if (existing.status === "SIGNE") return errorResponse("Un contrat signé ne peut pas être supprimé");

    const { error } = await supabase.from("contrats").delete().eq("id", id).eq("organisation_id", profile.organisation_id);
    if (error) return errorResponse(error.message);

    revalidatePath("/contrats");
    return successResponse("Contrat supprimé avec succès");
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la suppression du contrat");
  }
}

export async function duplicateContrat(id: string): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const supabase = createClient();
    const { data: original } = await supabase
      .from("contrats")
      .select("*")
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (!original) return errorResponse("Contrat non trouvé") as ActionResponse<{ id: string }>;

    // New dates: start = today, end = today + same duration
    const origStart = new Date(original.start_date);
    const origEnd = new Date(original.end_date);
    const durationMs = origEnd.getTime() - origStart.getTime();
    const newStart = new Date();
    const newEnd = new Date(newStart.getTime() + durationMs);

    const { data: created, error } = await supabase
      .from("contrats")
      .insert({
        organisation_id: profile.organisation_id,
        proprietaire_id: original.proprietaire_id,
        logement_id: original.logement_id,
        type: original.type,
        start_date: newStart.toISOString().split("T")[0],
        end_date: newEnd.toISOString().split("T")[0],
        commission_rate: original.commission_rate,
        status: "ACTIF",
        conditions: original.conditions,
        auto_renew: original.auto_renew ?? false,
        renewal_duration_months: original.renewal_duration_months ?? 12,
      })
      .select("id")
      .single();

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/contrats");
    return successResponse("Contrat dupliqué avec succès", { id: created.id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la duplication du contrat") as ActionResponse<{ id: string }>;
  }
}

export async function markContratAsSigned(id: string): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé");
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

    if (error) return errorResponse(error.message);
    revalidatePath(`/contrats/${id}`);
    revalidatePath("/contrats");
    return successResponse("Contrat marqué comme signé");
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la signature du contrat");
  }
}
