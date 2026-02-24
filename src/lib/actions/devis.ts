"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import { devisSchema, type DevisFormData } from "@/lib/schemas";
import type { DevisPrestataire } from "@/types/database";

// ---------------------------------------------------------------------------
// Get Devis for an Incident
// ---------------------------------------------------------------------------

export async function getDevisForIncident(
  incidentId: string
): Promise<DevisPrestataire[]> {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("devis_prestataires")
    .select("*, prestataire:prestataires(id, full_name), incident:incidents(id, description), mission:missions(id, type), reviewer:profiles!devis_prestataires_reviewed_by_fkey(id, full_name)")
    .eq("incident_id", incidentId)
    .eq("organisation_id", profile.organisation_id)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as unknown as DevisPrestataire[];
}

// ---------------------------------------------------------------------------
// Get Devis for a Prestataire
// ---------------------------------------------------------------------------

export async function getDevisForPrestataire(
  prestataireId: string
): Promise<DevisPrestataire[]> {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("devis_prestataires")
    .select("*, prestataire:prestataires(id, full_name), incident:incidents(id, description), mission:missions(id, type), reviewer:profiles!devis_prestataires_reviewed_by_fkey(id, full_name)")
    .eq("prestataire_id", prestataireId)
    .eq("organisation_id", profile.organisation_id)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as unknown as DevisPrestataire[];
}

// ---------------------------------------------------------------------------
// Create Devis
// ---------------------------------------------------------------------------

export async function createDevis(
  data: DevisFormData & { organisation_id: string }
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) {
      return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;
    }

    const parsed = devisSchema.parse(data);
    const supabase = createClient();

    const { data: created, error } = await supabase
      .from("devis_prestataires")
      .insert({
        organisation_id: profile.organisation_id,
        prestataire_id: parsed.prestataire_id,
        incident_id: parsed.incident_id || null,
        mission_id: parsed.mission_id || null,
        montant: parsed.montant,
        description: parsed.description,
        notes: parsed.notes || null,
        status: "SOUMIS",
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    if (parsed.incident_id) {
      revalidatePath(`/incidents/${parsed.incident_id}`);
    }
    revalidatePath(`/prestataires/${parsed.prestataire_id}`);
    return successResponse("Devis créé avec succès", { id: created.id });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la création du devis"
    ) as ActionResponse<{ id: string }>;
  }
}

// ---------------------------------------------------------------------------
// Accept Devis — auto-creates a facture
// ---------------------------------------------------------------------------

export async function acceptDevis(
  devisId: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) {
      return errorResponse("Non autorisé");
    }

    const supabase = createClient();

    // Fetch the devis
    const { data: devis, error: fetchError } = await supabase
      .from("devis_prestataires")
      .select("*")
      .eq("id", devisId)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (fetchError || !devis) {
      return errorResponse("Devis introuvable");
    }

    if (devis.status !== "SOUMIS") {
      return errorResponse("Ce devis a déjà été traité");
    }

    // Update devis status
    const { error: updateError } = await supabase
      .from("devis_prestataires")
      .update({
        status: "ACCEPTE",
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile.id,
      })
      .eq("id", devisId);

    if (updateError) return errorResponse(updateError.message);

    // Auto-create a facture from the devis data
    const { error: factureError } = await supabase
      .from("factures_prestataires")
      .insert({
        organisation_id: profile.organisation_id,
        prestataire_id: devis.prestataire_id,
        devis_id: devis.id,
        mission_id: devis.mission_id || null,
        incident_id: devis.incident_id || null,
        montant: devis.montant,
        date_emission: new Date().toISOString().split("T")[0],
        status: "ATTENTE",
        description: devis.description,
      });

    if (factureError) {
      // Log but don't fail — devis was already accepted
      console.error("Erreur création facture auto:", factureError.message);
    }

    if (devis.incident_id) {
      revalidatePath(`/incidents/${devis.incident_id}`);
    }
    revalidatePath(`/prestataires/${devis.prestataire_id}`);
    return successResponse("Devis accepté — facture créée automatiquement");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de l'acceptation du devis"
    );
  }
}

// ---------------------------------------------------------------------------
// Refuse Devis
// ---------------------------------------------------------------------------

export async function refuseDevis(
  devisId: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) {
      return errorResponse("Non autorisé");
    }

    const supabase = createClient();

    const { data: devis, error: fetchError } = await supabase
      .from("devis_prestataires")
      .select("incident_id, prestataire_id, status")
      .eq("id", devisId)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (fetchError || !devis) {
      return errorResponse("Devis introuvable");
    }

    if (devis.status !== "SOUMIS") {
      return errorResponse("Ce devis a déjà été traité");
    }

    const { error } = await supabase
      .from("devis_prestataires")
      .update({
        status: "REFUSE",
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile.id,
      })
      .eq("id", devisId);

    if (error) return errorResponse(error.message);

    if (devis.incident_id) {
      revalidatePath(`/incidents/${devis.incident_id}`);
    }
    revalidatePath(`/prestataires/${devis.prestataire_id}`);
    return successResponse("Devis refusé");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors du refus du devis"
    );
  }
}
