"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import type { ContratVersion } from "@/types/database";

/**
 * List all versions for a given contrat, ordered by version_number desc
 */
export async function getContratVersions(
  contratId: string
): Promise<ContratVersion[]> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    const { data, error } = await supabase
      .from("contrat_versions")
      .select("*, changer:profiles!contrat_versions_changed_by_fkey(id, full_name)")
      .eq("contrat_id", contratId)
      .eq("organisation_id", profile.organisation_id)
      .order("version_number", { ascending: false });

    if (error) {
      console.error("getContratVersions error:", error);
      // Fallback: try without join if FK doesn't exist
      const { data: fallback } = await supabase
        .from("contrat_versions")
        .select("*")
        .eq("contrat_id", contratId)
        .eq("organisation_id", profile.organisation_id)
        .order("version_number", { ascending: false });
      return (fallback ?? []) as ContratVersion[];
    }

    return (data ?? []) as ContratVersion[];
  } catch {
    return [];
  }
}

/**
 * Create a new version snapshot for a contrat (auto-increments version_number)
 */
export async function createContratVersion(
  contratId: string,
  content: Record<string, unknown>,
  changeSummary?: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    // Get current max version number
    const { data: latestVersion } = await supabase
      .from("contrat_versions")
      .select("version_number")
      .eq("contrat_id", contratId)
      .eq("organisation_id", profile.organisation_id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersionNumber = (latestVersion?.version_number ?? 0) + 1;

    const { data: created, error } = await supabase
      .from("contrat_versions")
      .insert({
        contrat_id: contratId,
        organisation_id: profile.organisation_id,
        version_number: nextVersionNumber,
        content,
        changed_by: profile.id,
        change_summary: changeSummary || null,
      })
      .select("id")
      .single();

    if (error)
      return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath(`/contrats/${contratId}`);
    return successResponse("Version cr\u00e9\u00e9e", { id: created.id });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la cr\u00e9ation de la version"
    ) as ActionResponse<{ id: string }>;
  }
}

/**
 * Get a single version by ID
 */
export async function getContratVersion(
  versionId: string
): Promise<ContratVersion | null> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    const { data, error } = await supabase
      .from("contrat_versions")
      .select("*")
      .eq("id", versionId)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (error || !data) return null;
    return data as ContratVersion;
  } catch {
    return null;
  }
}
