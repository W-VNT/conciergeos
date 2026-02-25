"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import type {
  Prestataire,
  Mission,
  Incident,
  DevisPrestataire,
  FacturePrestataire,
  PrestatairePortalToken,
} from "@/types/database";

// ---------------------------------------------------------------------------
// Generate Prestataire Portal Token
// ---------------------------------------------------------------------------

export async function generatePrestatairePortalToken(
  prestataireId: string
): Promise<ActionResponse<{ token: string; url: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) {
      return errorResponse("Non autorisé") as ActionResponse<{ token: string; url: string }>;
    }

    const supabase = createClient();

    // Verify the prestataire belongs to the org
    const { data: prestataire, error: prestError } = await supabase
      .from("prestataires")
      .select("id")
      .eq("id", prestataireId)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (prestError || !prestataire) {
      return errorResponse("Prestataire introuvable") as ActionResponse<{ token: string; url: string }>;
    }

    // Generate a cryptographically secure random token
    const token = (await import("crypto")).randomBytes(32).toString("hex");

    // Expire in 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Upsert: if a token already exists for this prestataire, update it
    const { data: existing } = await supabase
      .from("prestataire_portal_tokens")
      .select("id")
      .eq("prestataire_id", prestataireId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("prestataire_portal_tokens")
        .update({
          token,
          expires_at: expiresAt.toISOString(),
        })
        .eq("id", existing.id);

      if (error) return errorResponse(error.message) as ActionResponse<{ token: string; url: string }>;
    } else {
      const { error } = await supabase
        .from("prestataire_portal_tokens")
        .insert({
          prestataire_id: prestataireId,
          organisation_id: profile.organisation_id,
          token,
          expires_at: expiresAt.toISOString(),
        });

      if (error) return errorResponse(error.message) as ActionResponse<{ token: string; url: string }>;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${baseUrl}/prestataire-portal/${token}`;

    revalidatePath(`/prestataires/${prestataireId}`);
    return successResponse("Lien portail généré avec succès", { token, url });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la génération du lien portail"
    ) as ActionResponse<{ token: string; url: string }>;
  }
}

// ---------------------------------------------------------------------------
// Revoke Prestataire Portal Token
// ---------------------------------------------------------------------------

export async function revokePrestatairePortalToken(
  tokenId: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) {
      return errorResponse("Non autorisé");
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("prestataire_portal_tokens")
      .delete()
      .eq("id", tokenId)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath("/prestataires");
    return successResponse("Lien portail révoqué avec succès");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la révocation du lien"
    );
  }
}

// ---------------------------------------------------------------------------
// Get Active Token for a Prestataire (admin use)
// ---------------------------------------------------------------------------

export async function getPortalTokenForPrestataire(
  prestataireId: string
): Promise<PrestatairePortalToken | null> {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data } = await supabase
    .from("prestataire_portal_tokens")
    .select("*")
    .eq("prestataire_id", prestataireId)
    .eq("organisation_id", profile.organisation_id)
    .maybeSingle();

  return data as PrestatairePortalToken | null;
}

// ---------------------------------------------------------------------------
// Get Prestataire Portal Data (PUBLIC — no auth needed)
// ---------------------------------------------------------------------------

export interface PrestatairePortalData {
  prestataire: Prestataire;
  missions: Mission[];
  incidents: Incident[];
  devis: DevisPrestataire[];
  factures: FacturePrestataire[];
}

export async function getPrestatairePortalData(
  token: string
): Promise<{ valid: boolean; expired?: boolean; data?: PrestatairePortalData }> {
  const supabase = createClient();

  // Fetch the token
  const { data: portalToken, error: tokenError } = await supabase
    .from("prestataire_portal_tokens")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (tokenError || !portalToken) {
    return { valid: false };
  }

  // Check expiry
  if (new Date(portalToken.expires_at) < new Date()) {
    return { valid: false, expired: true };
  }

  const prestataireId = portalToken.prestataire_id;
  const organisationId = portalToken.organisation_id;

  // Fetch prestataire info
  const { data: prestataire, error: prestError } = await supabase
    .from("prestataires")
    .select("*")
    .eq("id", prestataireId)
    .eq("organisation_id", organisationId)
    .single();

  if (prestError || !prestataire) {
    return { valid: false };
  }

  // Fetch missions assigned to this prestataire (A_FAIRE or EN_COURS)
  const { data: missions } = await supabase
    .from("missions")
    .select("*, logement:logements(id, name)")
    .eq("assigned_to", prestataireId)
    .eq("organisation_id", organisationId)
    .in("status", ["A_FAIRE", "EN_COURS"])
    .order("scheduled_at", { ascending: true });

  // Fetch incidents assigned to this prestataire (OUVERT or EN_COURS)
  const { data: incidents } = await supabase
    .from("incidents")
    .select("*, logement:logements(id, name)")
    .eq("prestataire_id", prestataireId)
    .eq("organisation_id", organisationId)
    .in("status", ["OUVERT", "EN_COURS"])
    .order("opened_at", { ascending: false });

  // Fetch devis for this prestataire
  const { data: devis } = await supabase
    .from("devis_prestataires")
    .select("*")
    .eq("prestataire_id", prestataireId)
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: false });

  // Fetch factures for this prestataire
  const { data: factures } = await supabase
    .from("factures_prestataires")
    .select("*")
    .eq("prestataire_id", prestataireId)
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: false });

  return {
    valid: true,
    data: {
      prestataire: prestataire as Prestataire,
      missions: (missions ?? []) as Mission[],
      incidents: (incidents ?? []) as Incident[],
      devis: (devis ?? []) as DevisPrestataire[],
      factures: (factures ?? []) as FacturePrestataire[],
    },
  };
}

// ---------------------------------------------------------------------------
// Update Mission Status from Portal (PUBLIC — token-validated)
// ---------------------------------------------------------------------------

export async function updateMissionStatusFromPortal(
  token: string,
  missionId: string,
  status: "EN_COURS" | "TERMINE"
): Promise<ActionResponse> {
  try {
    const supabase = createClient();

    // Validate token
    const { data: portalToken } = await supabase
      .from("prestataire_portal_tokens")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (!portalToken || new Date(portalToken.expires_at) < new Date()) {
      return errorResponse("Token invalide ou expiré");
    }

    // Verify mission belongs to this prestataire
    const { data: mission } = await supabase
      .from("missions")
      .select("id, assigned_to")
      .eq("id", missionId)
      .eq("organisation_id", portalToken.organisation_id)
      .single();

    if (!mission || mission.assigned_to !== portalToken.prestataire_id) {
      return errorResponse("Mission introuvable ou non assignée");
    }

    const updateData: Record<string, string> = { status };
    if (status === "EN_COURS") {
      updateData.started_at = new Date().toISOString();
    } else if (status === "TERMINE") {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("missions")
      .update(updateData)
      .eq("id", missionId);

    if (error) return errorResponse(error.message);

    revalidatePath(`/prestataire-portal/${token}`);
    return successResponse("Statut de la mission mis à jour");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la mise à jour"
    );
  }
}

// ---------------------------------------------------------------------------
// Update Incident Status from Portal (PUBLIC — token-validated)
// ---------------------------------------------------------------------------

export async function updateIncidentStatusFromPortal(
  token: string,
  incidentId: string,
  status: "EN_COURS" | "RESOLU"
): Promise<ActionResponse> {
  try {
    const supabase = createClient();

    // Validate token
    const { data: portalToken } = await supabase
      .from("prestataire_portal_tokens")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (!portalToken || new Date(portalToken.expires_at) < new Date()) {
      return errorResponse("Token invalide ou expiré");
    }

    // Verify incident belongs to this prestataire
    const { data: incident } = await supabase
      .from("incidents")
      .select("id, prestataire_id")
      .eq("id", incidentId)
      .eq("organisation_id", portalToken.organisation_id)
      .single();

    if (!incident || incident.prestataire_id !== portalToken.prestataire_id) {
      return errorResponse("Incident introuvable ou non assigné");
    }

    const updateData: Record<string, string> = { status };
    if (status === "RESOLU") {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("incidents")
      .update(updateData)
      .eq("id", incidentId);

    if (error) return errorResponse(error.message);

    revalidatePath(`/prestataire-portal/${token}`);
    return successResponse("Statut de l'incident mis à jour");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la mise à jour"
    );
  }
}

// ---------------------------------------------------------------------------
// Submit Devis from Portal (PUBLIC — token-validated)
// ---------------------------------------------------------------------------

export async function submitDevisFromPortal(
  token: string,
  data: {
    incidentId?: string;
    missionId?: string;
    montant: number;
    description: string;
  }
): Promise<ActionResponse> {
  try {
    const supabase = createClient();

    // Validate token
    const { data: portalToken } = await supabase
      .from("prestataire_portal_tokens")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (!portalToken || new Date(portalToken.expires_at) < new Date()) {
      return errorResponse("Token invalide ou expiré");
    }

    const { error } = await supabase
      .from("devis_prestataires")
      .insert({
        organisation_id: portalToken.organisation_id,
        prestataire_id: portalToken.prestataire_id,
        incident_id: data.incidentId || null,
        mission_id: data.missionId || null,
        montant: data.montant,
        description: data.description,
        status: "SOUMIS",
        submitted_at: new Date().toISOString(),
      });

    if (error) return errorResponse(error.message);

    revalidatePath(`/prestataire-portal/${token}`);
    return successResponse("Devis soumis avec succès");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la soumission du devis"
    );
  }
}
