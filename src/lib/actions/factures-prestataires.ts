"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import { factureSchema, type FactureFormData } from "@/lib/schemas";
import type { FacturePrestataire } from "@/types/database";

// ---------------------------------------------------------------------------
// Get Factures for a Prestataire
// ---------------------------------------------------------------------------

export async function getFacturesForPrestataire(
  prestataireId: string
): Promise<FacturePrestataire[]> {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("factures_prestataires")
    .select("*, prestataire:prestataires(id, full_name), mission:missions(id, type), incident:incidents(id, description), devis:devis_prestataires(id, montant, description)")
    .eq("prestataire_id", prestataireId)
    .eq("organisation_id", profile.organisation_id)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as unknown as FacturePrestataire[];
}

// ---------------------------------------------------------------------------
// Get Factures for an Incident
// ---------------------------------------------------------------------------

export async function getFacturesForIncident(
  incidentId: string
): Promise<FacturePrestataire[]> {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("factures_prestataires")
    .select("*, prestataire:prestataires(id, full_name), mission:missions(id, type), incident:incidents(id, description), devis:devis_prestataires(id, montant, description)")
    .eq("incident_id", incidentId)
    .eq("organisation_id", profile.organisation_id)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as unknown as FacturePrestataire[];
}

// ---------------------------------------------------------------------------
// Create Facture
// ---------------------------------------------------------------------------

export async function createFacture(
  data: FactureFormData & { organisation_id: string }
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) {
      return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;
    }

    const parsed = factureSchema.parse(data);
    const supabase = createClient();

    const { data: created, error } = await supabase
      .from("factures_prestataires")
      .insert({
        organisation_id: profile.organisation_id,
        prestataire_id: parsed.prestataire_id,
        devis_id: parsed.devis_id || null,
        mission_id: parsed.mission_id || null,
        incident_id: parsed.incident_id || null,
        numero_facture: parsed.numero_facture || null,
        montant: parsed.montant,
        date_emission: parsed.date_emission,
        date_echeance: parsed.date_echeance || null,
        status: "ATTENTE",
        description: parsed.description || null,
        notes: parsed.notes || null,
      })
      .select("id")
      .single();

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath(`/prestataires/${parsed.prestataire_id}`);
    if (parsed.incident_id) {
      revalidatePath(`/incidents/${parsed.incident_id}`);
    }
    return successResponse("Facture créée avec succès", { id: created.id });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la création de la facture"
    ) as ActionResponse<{ id: string }>;
  }
}

// ---------------------------------------------------------------------------
// Validate Facture
// ---------------------------------------------------------------------------

export async function validateFacture(
  factureId: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) {
      return errorResponse("Non autorisé");
    }

    const supabase = createClient();

    const { data: facture, error: fetchError } = await supabase
      .from("factures_prestataires")
      .select("prestataire_id, incident_id, status")
      .eq("id", factureId)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (fetchError || !facture) {
      return errorResponse("Facture introuvable");
    }

    if (facture.status !== "ATTENTE") {
      return errorResponse("Cette facture ne peut pas être validée dans son état actuel");
    }

    const { error } = await supabase
      .from("factures_prestataires")
      .update({ status: "VALIDEE" })
      .eq("id", factureId);

    if (error) return errorResponse(error.message);

    revalidatePath(`/prestataires/${facture.prestataire_id}`);
    if (facture.incident_id) {
      revalidatePath(`/incidents/${facture.incident_id}`);
    }
    return successResponse("Facture validée");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la validation"
    );
  }
}

// ---------------------------------------------------------------------------
// Mark Facture as Paid
// ---------------------------------------------------------------------------

export async function markFacturePaid(
  factureId: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) {
      return errorResponse("Non autorisé");
    }

    const supabase = createClient();

    const { data: facture, error: fetchError } = await supabase
      .from("factures_prestataires")
      .select("prestataire_id, incident_id, status")
      .eq("id", factureId)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (fetchError || !facture) {
      return errorResponse("Facture introuvable");
    }

    if (facture.status !== "VALIDEE") {
      return errorResponse("Seule une facture validée peut être marquée comme payée");
    }

    const { error } = await supabase
      .from("factures_prestataires")
      .update({
        status: "PAYEE",
        date_paiement: new Date().toISOString().split("T")[0],
      })
      .eq("id", factureId);

    if (error) return errorResponse(error.message);

    revalidatePath(`/prestataires/${facture.prestataire_id}`);
    if (facture.incident_id) {
      revalidatePath(`/incidents/${facture.incident_id}`);
    }
    return successResponse("Facture marquée comme payée");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la mise à jour"
    );
  }
}

// ---------------------------------------------------------------------------
// Refuse Facture
// ---------------------------------------------------------------------------

export async function refuseFacture(
  factureId: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) {
      return errorResponse("Non autorisé");
    }

    const supabase = createClient();

    const { data: facture, error: fetchError } = await supabase
      .from("factures_prestataires")
      .select("prestataire_id, incident_id, status")
      .eq("id", factureId)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (fetchError || !facture) {
      return errorResponse("Facture introuvable");
    }

    if (facture.status === "PAYEE") {
      return errorResponse("Une facture payée ne peut pas être refusée");
    }

    const { error } = await supabase
      .from("factures_prestataires")
      .update({ status: "REFUSEE" })
      .eq("id", factureId);

    if (error) return errorResponse(error.message);

    revalidatePath(`/prestataires/${facture.prestataire_id}`);
    if (facture.incident_id) {
      revalidatePath(`/incidents/${facture.incident_id}`);
    }
    return successResponse("Facture refusée");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors du refus de la facture"
    );
  }
}
