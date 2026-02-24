"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import type { InterventionChecklist } from "@/types/database";

/**
 * Get the intervention checklist for a given incident
 */
export async function getInterventionChecklist(
  incidentId: string
): Promise<InterventionChecklist | null> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    const { data, error } = await supabase
      .from("intervention_checklists")
      .select("*")
      .eq("incident_id", incidentId)
      .eq("organisation_id", profile.organisation_id)
      .maybeSingle();

    if (error || !data) return null;

    return data as InterventionChecklist;
  } catch {
    return null;
  }
}

/**
 * Create a new intervention checklist for an incident (admin only)
 */
export async function createInterventionChecklist(
  incidentId: string,
  items: Array<{ label: string; checked: boolean; note?: string }>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile))
      return errorResponse("Non autoris\u00e9") as ActionResponse<{ id: string }>;

    if (!items || items.length === 0)
      return errorResponse("Au moins un \u00e9l\u00e9ment requis") as ActionResponse<{ id: string }>;

    const supabase = createClient();

    // Check no existing checklist
    const { data: existing } = await supabase
      .from("intervention_checklists")
      .select("id")
      .eq("incident_id", incidentId)
      .eq("organisation_id", profile.organisation_id)
      .maybeSingle();

    if (existing)
      return errorResponse("Une checklist existe d\u00e9j\u00e0 pour cet incident") as ActionResponse<{ id: string }>;

    const { data: created, error } = await supabase
      .from("intervention_checklists")
      .insert({
        incident_id: incidentId,
        organisation_id: profile.organisation_id,
        items: items.map((item) => ({
          label: item.label,
          checked: false,
          note: item.note ?? "",
        })),
      })
      .select("id")
      .single();

    if (error)
      return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath(`/incidents/${incidentId}`);
    return successResponse("Checklist cr\u00e9\u00e9e avec succ\u00e8s", { id: created.id });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la cr\u00e9ation de la checklist"
    ) as ActionResponse<{ id: string }>;
  }
}

/**
 * Toggle a checklist item and optionally set a note
 */
export async function updateChecklistItem(
  checklistId: string,
  itemIndex: number,
  checked: boolean,
  note?: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    // Fetch current checklist
    const { data: checklist, error: fetchError } = await supabase
      .from("intervention_checklists")
      .select("*")
      .eq("id", checklistId)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (fetchError || !checklist)
      return errorResponse("Checklist non trouv\u00e9e");

    const items = checklist.items as Array<{ label: string; checked: boolean; note?: string }>;
    if (itemIndex < 0 || itemIndex >= items.length)
      return errorResponse("Index d'\u00e9l\u00e9ment invalide");

    items[itemIndex] = {
      ...items[itemIndex],
      checked,
      ...(note !== undefined ? { note } : {}),
    };

    const { error } = await supabase
      .from("intervention_checklists")
      .update({ items })
      .eq("id", checklistId)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath(`/incidents/${checklist.incident_id}`);
    return successResponse("\u00c9l\u00e9ment mis \u00e0 jour");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la mise \u00e0 jour"
    );
  }
}

/**
 * Mark a checklist as completed
 */
export async function completeChecklist(
  checklistId: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    // Verify all items are checked
    const { data: checklist, error: fetchError } = await supabase
      .from("intervention_checklists")
      .select("*")
      .eq("id", checklistId)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (fetchError || !checklist)
      return errorResponse("Checklist non trouv\u00e9e");

    const items = checklist.items as Array<{ label: string; checked: boolean; note?: string }>;
    const allChecked = items.every((item) => item.checked);
    if (!allChecked)
      return errorResponse("Tous les \u00e9l\u00e9ments doivent \u00eatre coch\u00e9s pour compl\u00e9ter la checklist");

    const { error } = await supabase
      .from("intervention_checklists")
      .update({
        completed_by: profile.id,
        completed_at: new Date().toISOString(),
      })
      .eq("id", checklistId)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath(`/incidents/${checklist.incident_id}`);
    return successResponse("Checklist compl\u00e9t\u00e9e avec succ\u00e8s");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la compl\u00e9tion de la checklist"
    );
  }
}
