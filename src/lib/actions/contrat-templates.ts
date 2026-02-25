"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { contratTemplateSchema, type ContratTemplateFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import type { ContratTemplate } from "@/types/database";

const AVAILABLE_VARIABLES = [
  { key: "proprietaire_nom", label: "Nom du propri\u00e9taire" },
  { key: "logement_nom", label: "Nom du logement" },
  { key: "commission_rate", label: "Taux de commission" },
  { key: "start_date", label: "Date de d\u00e9but" },
  { key: "end_date", label: "Date de fin" },
  { key: "type_contrat", label: "Type de contrat" },
];

/**
 * List all contract templates for the current organisation
 */
export async function getContratTemplates(): Promise<ContratTemplate[]> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return [];

    const supabase = createClient();
    const { data, error } = await supabase
      .from("contrat_templates")
      .select("*")
      .eq("organisation_id", profile.organisation_id)
      .order("created_at", { ascending: false });

    if (error) return [];
    return (data ?? []) as ContratTemplate[];
  } catch {
    return [];
  }
}

/**
 * Get a single contract template by ID
 */
export async function getContratTemplate(
  id: string
): Promise<ContratTemplate | null> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return null;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("contrat_templates")
      .select("*")
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (error || !data) return null;
    return data as ContratTemplate;
  } catch {
    return null;
  }
}

/**
 * Create a new contract template (admin only)
 */
export async function createContratTemplate(
  data: ContratTemplateFormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile))
      return errorResponse("Non autoris\u00e9") as ActionResponse<{ id: string }>;

    const parsed = contratTemplateSchema.parse(data);
    const supabase = createClient();

    const { data: created, error } = await supabase
      .from("contrat_templates")
      .insert({
        organisation_id: profile.organisation_id,
        name: parsed.name,
        content: parsed.content,
        category: parsed.category || "GENERAL",
        variables: AVAILABLE_VARIABLES,
      })
      .select("id")
      .single();

    if (error)
      return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/contrats/templates");
    return successResponse("Mod\u00e8le cr\u00e9\u00e9 avec succ\u00e8s", { id: created.id });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la cr\u00e9ation du mod\u00e8le"
    ) as ActionResponse<{ id: string }>;
  }
}

/**
 * Update a contract template (admin only)
 */
export async function updateContratTemplate(
  id: string,
  data: ContratTemplateFormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile))
      return errorResponse("Non autoris\u00e9") as ActionResponse<{ id: string }>;

    const parsed = contratTemplateSchema.parse(data);
    const supabase = createClient();

    const { error } = await supabase
      .from("contrat_templates")
      .update({
        name: parsed.name,
        content: parsed.content,
        category: parsed.category || "GENERAL",
      })
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error)
      return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/contrats/templates");
    revalidatePath(`/contrats/templates/${id}`);
    return successResponse("Mod\u00e8le mis \u00e0 jour avec succ\u00e8s", { id });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la mise \u00e0 jour du mod\u00e8le"
    ) as ActionResponse<{ id: string }>;
  }
}

/**
 * Delete a contract template (admin only)
 */
export async function deleteContratTemplate(
  id: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autoris\u00e9");

    const supabase = createClient();

    const { error } = await supabase
      .from("contrat_templates")
      .delete()
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath("/contrats/templates");
    return successResponse("Mod\u00e8le supprim\u00e9 avec succ\u00e8s");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la suppression du mod\u00e8le"
    );
  }
}

/**
 * Render a template by replacing {{variable}} placeholders with actual values
 */
export async function renderContratTemplate(
  id: string,
  variables: Record<string, string>
): Promise<ActionResponse<{ rendered: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile))
      return errorResponse("Non autoris\u00e9") as ActionResponse<{ rendered: string }>;

    const supabase = createClient();
    const { data: template, error } = await supabase
      .from("contrat_templates")
      .select("content")
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (error || !template)
      return errorResponse("Mod\u00e8le non trouv\u00e9") as ActionResponse<{ rendered: string }>;

    let rendered = template.content as string;
    // Only allow safe variable keys (alphanumeric + underscore) to prevent ReDoS
    const SAFE_KEY_RE = /^[a-zA-Z0-9_]+$/;
    for (const [key, value] of Object.entries(variables)) {
      if (!SAFE_KEY_RE.test(key)) continue;
      // Escape HTML in values to prevent injection
      const safeValue = String(value).replace(/</g, "&lt;").replace(/>/g, "&gt;");
      rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), safeValue);
    }

    return successResponse("Mod\u00e8le rendu avec succ\u00e8s", { rendered });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors du rendu du mod\u00e8le"
    ) as ActionResponse<{ rendered: string }>;
  }
}
