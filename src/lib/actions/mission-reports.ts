"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { missionReportSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import type { MissionReport } from "@/types/database";

export async function getMissionReport(
  missionId: string
): Promise<MissionReport | null> {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data } = await supabase
    .from("mission_reports")
    .select("*, submitter:profiles!submitted_by(id, full_name)")
    .eq("mission_id", missionId)
    .eq("organisation_id", profile.organisation_id)
    .maybeSingle();

  return data as MissionReport | null;
}

export async function createMissionReport(data: {
  mission_id: string;
  checklist: Array<{ label: string; checked: boolean }>;
  notes: string;
  issues_found: string;
  supplies_used: Array<{ name: string; quantity: number }>;
}): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    const parsed = missionReportSchema.parse({
      mission_id: data.mission_id,
      notes: data.notes,
      issues_found: data.issues_found,
    });
    const supabase = createClient();

    // Verify mission belongs to org
    const { data: mission, error: missionError } = await supabase
      .from("missions")
      .select("id")
      .eq("id", parsed.mission_id)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (missionError || !mission) {
      return errorResponse("Mission non trouvée") as ActionResponse<{ id: string }>;
    }

    // Check if report already exists
    const { data: existing } = await supabase
      .from("mission_reports")
      .select("id")
      .eq("mission_id", parsed.mission_id)
      .eq("organisation_id", profile.organisation_id)
      .maybeSingle();

    if (existing) {
      return errorResponse("Un rapport existe déjà pour cette mission") as ActionResponse<{ id: string }>;
    }

    const { data: created, error } = await supabase
      .from("mission_reports")
      .insert({
        mission_id: parsed.mission_id,
        organisation_id: profile.organisation_id,
        submitted_by: profile.id,
        status: "SOUMIS",
        checklist: data.checklist,
        notes: parsed.notes || null,
        issues_found: parsed.issues_found || null,
        supplies_used: data.supplies_used,
        photo_urls: [],
      })
      .select("id")
      .single();

    if (error) {
      return errorResponse(error.message) as ActionResponse<{ id: string }>;
    }

    revalidatePath(`/missions/${parsed.mission_id}`);
    revalidatePath("/missions");
    return successResponse("Rapport de mission créé avec succès", { id: created.id });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la création du rapport"
    ) as ActionResponse<{ id: string }>;
  }
}

export async function validateMissionReport(
  reportId: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé");
    const supabase = createClient();

    const { data: report, error: fetchError } = await supabase
      .from("mission_reports")
      .select("id, mission_id")
      .eq("id", reportId)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (fetchError || !report) return errorResponse("Rapport non trouvé");

    const { error } = await supabase
      .from("mission_reports")
      .update({ status: "VALIDE", updated_at: new Date().toISOString() })
      .eq("id", reportId)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath(`/missions/${report.mission_id}`);
    revalidatePath("/missions");
    return successResponse("Rapport validé avec succès");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la validation du rapport"
    );
  }
}

export async function rejectMissionReport(
  reportId: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé");
    const supabase = createClient();

    const { data: report, error: fetchError } = await supabase
      .from("mission_reports")
      .select("id, mission_id")
      .eq("id", reportId)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (fetchError || !report) return errorResponse("Rapport non trouvé");

    const { error } = await supabase
      .from("mission_reports")
      .update({ status: "REJETE", updated_at: new Date().toISOString() })
      .eq("id", reportId)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath(`/missions/${report.mission_id}`);
    revalidatePath("/missions");
    return successResponse("Rapport rejeté");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors du rejet du rapport"
    );
  }
}
