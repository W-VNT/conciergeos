"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { MissionType } from "@/types/database";
import { z } from "zod";

/**
 * Get checklist for a mission
 */
export async function getMissionChecklist(missionId: string) {
  try {
    const profile = await requireProfile();
    const supabase = await createClient();

    // Verify mission belongs to this organisation
    const { data: mission } = await supabase
      .from("missions")
      .select("id")
      .eq("id", missionId)
      .eq("organisation_id", profile.organisation_id)
      .single();
    if (!mission) return { error: "Mission non trouvée" };

    const { data: items, error } = await supabase
      .from("mission_checklist_items")
      .select(`
        *,
        item:checklist_template_items(*)
      `)
      .eq("mission_id", missionId)
      .order("item(ordre)", { ascending: true });

    if (error) {
      console.error("Get mission checklist error:", error);
      return { error: "Erreur lors de la récupération de la checklist" };
    }

    return { items };
  } catch (error) {
    console.error("Get mission checklist error:", error);
    return { error: "Une erreur est survenue" };
  }
}

/**
 * Create checklist items for a mission from a template
 */
export async function createMissionChecklistFromTemplate(
  missionId: string,
  templateId: string
) {
  try {
    const profile = await requireProfile();
    const supabase = await createClient();

    // Verify mission belongs to this organisation
    const { data: mission } = await supabase
      .from("missions")
      .select("id")
      .eq("id", missionId)
      .eq("organisation_id", profile.organisation_id)
      .single();
    if (!mission) return { error: "Mission non trouvée" };

    // Verify template belongs to this organisation
    const { data: template } = await supabase
      .from("checklist_templates")
      .select("id")
      .eq("id", templateId)
      .eq("organisation_id", profile.organisation_id)
      .single();
    if (!template) return { error: "Template non trouvé" };

    // Get template items
    const { data: templateItems, error: templateError } = await supabase
      .from("checklist_template_items")
      .select("*")
      .eq("template_id", templateId)
      .order("ordre", { ascending: true });

    if (templateError || !templateItems) {
      console.error("Get template items error:", templateError);
      return { error: "Erreur lors de la récupération du template" };
    }

    // Create mission checklist items
    const missionItems = templateItems.map((item) => ({
      mission_id: missionId,
      item_id: item.id,
      completed: false,
    }));

    const { error: insertError } = await supabase
      .from("mission_checklist_items")
      .insert(missionItems);

    if (insertError) {
      console.error("Insert mission checklist items error:", insertError);
      return { error: "Erreur lors de la création de la checklist" };
    }

    revalidatePath(`/missions/${missionId}`);

    return { success: true };
  } catch (error) {
    console.error("Create mission checklist error:", error);
    return { error: "Une erreur est survenue" };
  }
}

/**
 * Toggle checklist item completion
 */
export async function toggleChecklistItem(itemId: string, completed: boolean) {
  try {
    const profile = await requireProfile();
    const supabase = await createClient();

    // Get the item + verify mission belongs to this organisation
    const { data: item } = await supabase
      .from("mission_checklist_items")
      .select("mission_id, mission:missions(organisation_id)")
      .eq("id", itemId)
      .single();

    if (!item || (item.mission as unknown as { organisation_id: string })?.organisation_id !== profile.organisation_id) {
      return { error: "Item non trouvé" };
    }

    const { error } = await supabase
      .from("mission_checklist_items")
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        completed_by: completed ? profile.id : null,
      })
      .eq("id", itemId);

    if (error) {
      console.error("Toggle checklist item error:", error);
      return { error: "Erreur lors de la mise à jour de l'item" };
    }

    if (item) {
      revalidatePath(`/missions/${item.mission_id}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Toggle checklist item error:", error);
    return { error: "Une erreur est survenue" };
  }
}

/**
 * Update checklist item (add photo, notes)
 */
export async function updateChecklistItem(
  itemId: string,
  data: { photo_url?: string; notes?: string }
) {
  try {
    const profile = await requireProfile();
    const supabase = await createClient();

    // Get the item + verify mission belongs to this organisation
    const { data: item } = await supabase
      .from("mission_checklist_items")
      .select("mission_id, mission:missions(organisation_id)")
      .eq("id", itemId)
      .single();

    if (!item || (item.mission as unknown as { organisation_id: string })?.organisation_id !== profile.organisation_id) {
      return { error: "Item non trouvé" };
    }

    const parsed = z.object({
      photo_url: z.string().optional(),
      notes: z.string().max(5000).optional(),
    }).parse(data);

    const { error } = await supabase
      .from("mission_checklist_items")
      .update(parsed)
      .eq("id", itemId);

    if (error) {
      console.error("Update checklist item error:", error);
      return { error: "Erreur lors de la mise à jour de l'item" };
    }

    if (item) {
      revalidatePath(`/missions/${item.mission_id}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Update checklist item error:", error);
    return { error: "Une erreur est survenue" };
  }
}

/**
 * Get checklist templates for an organisation
 */
export async function getChecklistTemplates(typeMission?: MissionType) {
  try {
    const profile = await requireProfile();
    const supabase = await createClient();

    let query = supabase
      .from("checklist_templates")
      .select("*")
      .eq("organisation_id", profile.organisation_id)
      .eq("actif", true);

    if (typeMission) {
      query = query.eq("type_mission", typeMission);
    }

    const { data: templates, error } = await query.order("nom", {
      ascending: true,
    });

    if (error) {
      console.error("Get checklist templates error:", error);
      return { error: "Erreur lors de la récupération des templates" };
    }

    return { templates };
  } catch (error) {
    console.error("Get checklist templates error:", error);
    return { error: "Une erreur est survenue" };
  }
}

/**
 * Get template items for a template
 */
export async function getTemplateItems(templateId: string) {
  try {
    const profile = await requireProfile();
    const supabase = await createClient();

    // Verify template belongs to this organisation
    const { data: template } = await supabase
      .from("checklist_templates")
      .select("id")
      .eq("id", templateId)
      .eq("organisation_id", profile.organisation_id)
      .single();
    if (!template) return { error: "Template non trouvé" };

    const { data: items, error } = await supabase
      .from("checklist_template_items")
      .select("*")
      .eq("template_id", templateId)
      .order("ordre", { ascending: true });

    if (error) {
      console.error("Get template items error:", error);
      return { error: "Erreur lors de la récupération des items" };
    }

    return { items };
  } catch (error) {
    console.error("Get template items error:", error);
    return { error: "Une erreur est survenue" };
  }
}

// ---------------------------------------------------------------------------
// Template management per logement
// ---------------------------------------------------------------------------

/**
 * Get all checklist templates for a logement, with their items, keyed by type_mission
 */
export async function getLogementTemplatesWithItems(logementId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  // Verify logement belongs to this organisation
  const { data: logement } = await supabase
    .from("logements")
    .select("id")
    .eq("id", logementId)
    .eq("organisation_id", profile.organisation_id)
    .single();
  if (!logement) return { error: "Logement non trouvé" };

  const { data: templates, error } = await supabase
    .from("checklist_templates")
    .select("*, items:checklist_template_items(*)")
    .eq("logement_id", logementId)
    .eq("organisation_id", profile.organisation_id)
    .eq("actif", true)
    .order("created_at");

  if (error) return { error: error.message };

  // Sort items by ordre within each template
  const sorted = (templates ?? []).map((t) => ({
    ...t,
    items: (t.items ?? []).sort((a: { ordre: number }, b: { ordre: number }) => a.ordre - b.ordre),
  }));

  return { templates: sorted };
}

/**
 * Get or create the template for a given logement + mission type
 */
async function getOrCreateTemplate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  logementId: string,
  typeMission: MissionType,
  organisationId: string,
  templateName: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("checklist_templates")
    .select("id")
    .eq("logement_id", logementId)
    .eq("type_mission", typeMission)
    .eq("actif", true)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("checklist_templates")
    .insert({
      organisation_id: organisationId,
      logement_id: logementId,
      type_mission: typeMission,
      nom: templateName,
      actif: true,
    })
    .select("id")
    .single();

  return created?.id ?? null;
}

/**
 * Add an item to a logement checklist template (creates the template if needed)
 */
export async function addLogementChecklistItem(
  logementId: string,
  typeMission: MissionType,
  data: { titre: string; categorie: string; photo_requise: boolean }
) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) return { error: "Non autorisé" };

  const supabase = await createClient();

  // Verify logement belongs to this organisation
  const { data: logement } = await supabase
    .from("logements")
    .select("id")
    .eq("id", logementId)
    .eq("organisation_id", profile.organisation_id)
    .single();
  if (!logement) return { error: "Logement non trouvé" };

  const LABELS: Record<string, string> = {
    MENAGE: "Ménage",
    CHECKIN: "Check-in",
    CHECKOUT: "Check-out",
    INTERVENTION: "Intervention",
    URGENCE: "Urgence",
  };

  const templateId = await getOrCreateTemplate(
    supabase,
    logementId,
    typeMission,
    profile.organisation_id,
    LABELS[typeMission] ?? typeMission
  );
  if (!templateId) return { error: "Impossible de créer le template" };

  // Get current max ordre
  const { data: existing } = await supabase
    .from("checklist_template_items")
    .select("ordre")
    .eq("template_id", templateId)
    .order("ordre", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrdre = (existing?.ordre ?? 0) + 1;

  const { error } = await supabase.from("checklist_template_items").insert({
    template_id: templateId,
    titre: data.titre,
    categorie: data.categorie || null,
    photo_requise: data.photo_requise,
    ordre: nextOrdre,
  });

  if (error) return { error: error.message };

  revalidatePath(`/logements/${logementId}`);
  return { success: true };
}

/**
 * Update a checklist template item
 */
export async function updateLogementChecklistItem(
  itemId: string,
  logementId: string,
  data: { titre: string; categorie: string; photo_requise: boolean }
) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) return { error: "Non autorisé" };

  const supabase = await createClient();

  const { data: logement } = await supabase
    .from("logements")
    .select("id")
    .eq("id", logementId)
    .eq("organisation_id", profile.organisation_id)
    .single();
  if (!logement) return { error: "Logement non trouvé" };

  // Verify item belongs to a template of this logement
  const { data: item } = await supabase
    .from("checklist_template_items")
    .select("id, template:checklist_templates(logement_id)")
    .eq("id", itemId)
    .single();
  if (!item || (item.template as unknown as { logement_id: string })?.logement_id !== logementId) {
    return { error: "Item non trouvé" };
  }

  const { error } = await supabase
    .from("checklist_template_items")
    .update({
      titre: data.titre,
      categorie: data.categorie || null,
      photo_requise: data.photo_requise,
    })
    .eq("id", itemId);

  if (error) return { error: error.message };

  revalidatePath(`/logements/${logementId}`);
  return { success: true };
}

/**
 * Delete a checklist template item
 */
export async function deleteLogementChecklistItem(itemId: string, logementId: string) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) return { error: "Non autorisé" };

  const supabase = await createClient();

  const { data: logement } = await supabase
    .from("logements")
    .select("id")
    .eq("id", logementId)
    .eq("organisation_id", profile.organisation_id)
    .single();
  if (!logement) return { error: "Logement non trouvé" };

  // Verify item belongs to a template of this logement
  const { data: item } = await supabase
    .from("checklist_template_items")
    .select("id, template:checklist_templates(logement_id)")
    .eq("id", itemId)
    .single();
  if (!item || (item.template as unknown as { logement_id: string })?.logement_id !== logementId) {
    return { error: "Item non trouvé" };
  }

  const { error } = await supabase
    .from("checklist_template_items")
    .delete()
    .eq("id", itemId);

  if (error) return { error: error.message };

  revalidatePath(`/logements/${logementId}`);
  return { success: true };
}

/**
 * Find active template for a logement + mission type (used for auto-assign)
 */
export async function findLogementTemplate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  logementId: string,
  typeMission: MissionType,
  organisationId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("checklist_templates")
    .select("id")
    .eq("logement_id", logementId)
    .eq("type_mission", typeMission)
    .eq("actif", true)
    .eq("organisation_id", organisationId)
    .maybeSingle();
  return data?.id ?? null;
}
