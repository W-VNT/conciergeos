"use server";

import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import type { IncidentCategory, IncidentSeverity } from "@/types/database";

/**
 * Generate a unique incident report token for a logement (admin only)
 */
export async function generateIncidentReportToken(
  logementId: string
): Promise<ActionResponse<{ token: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile))
      return errorResponse("Non autorisé") as ActionResponse<{ token: string }>;

    const supabase = createClient();
    const token = crypto.randomBytes(32).toString("hex");

    const { error } = await supabase
      .from("logements")
      .update({ incident_report_token: token })
      .eq("id", logementId)
      .eq("organisation_id", profile.organisation_id);

    if (error)
      return errorResponse(error.message) as ActionResponse<{ token: string }>;

    revalidatePath(`/logements/${logementId}`);
    return successResponse("Lien de signalement généré avec succès", { token });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la génération du lien"
    ) as ActionResponse<{ token: string }>;
  }
}

/**
 * Public function (no auth) — find logement info by token
 */
export async function getPublicLogementInfo(
  token: string
): Promise<{
  logement_id: string;
  logement_name: string;
  organisation_id: string;
} | null> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("logements")
      .select("id, name, organisation_id")
      .eq("incident_report_token", token)
      .single();

    if (error || !data) return null;

    return {
      logement_id: data.id,
      logement_name: data.name,
      organisation_id: data.organisation_id,
    };
  } catch {
    return null;
  }
}

/**
 * Public function (no auth) — submit an incident via token
 */
export async function submitPublicIncident(
  token: string,
  data: {
    category: IncidentCategory;
    severity: IncidentSeverity;
    description: string;
    guest_name?: string;
  }
): Promise<ActionResponse> {
  try {
    const supabase = createClient();

    // Validate token and get logement
    const { data: logement, error: logementError } = await supabase
      .from("logements")
      .select("id, organisation_id")
      .eq("incident_report_token", token)
      .single();

    if (logementError || !logement)
      return errorResponse("Lien de signalement invalide");

    if (!data.description || data.description.trim().length === 0)
      return errorResponse("La description est requise");

    if (!data.category) return errorResponse("La catégorie est requise");
    if (!data.severity) return errorResponse("La sévérité est requise");

    const guestInfo = data.guest_name ? ` (signalé par: ${data.guest_name})` : "";

    const { error } = await supabase.from("incidents").insert({
      organisation_id: logement.organisation_id,
      logement_id: logement.id,
      severity: data.severity,
      status: "OUVERT",
      category: data.category,
      description: data.description.trim(),
      notes: guestInfo ? `Signalement public${guestInfo}` : "Signalement public",
    });

    if (error) return errorResponse("Erreur lors de l'envoi du signalement");

    return successResponse("Votre signalement a été envoyé avec succès. Merci !");
  } catch {
    return errorResponse("Erreur lors de l'envoi du signalement");
  }
}
