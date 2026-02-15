"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { MissionType } from "@/types/database";

/**
 * Get checklist for a mission
 */
export async function getMissionChecklist(missionId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

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
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

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
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

    // Get the item to find mission_id for revalidation
    const { data: item } = await supabase
      .from("mission_checklist_items")
      .select("mission_id")
      .eq("id", itemId)
      .single();

    const { error } = await supabase
      .from("mission_checklist_items")
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        completed_by: completed ? user.id : null,
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
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

    // Get the item to find mission_id for revalidation
    const { data: item } = await supabase
      .from("mission_checklist_items")
      .select("mission_id")
      .eq("id", itemId)
      .single();

    const { error } = await supabase
      .from("mission_checklist_items")
      .update(data)
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
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

    // Get user's organisation
    const { data: profile } = await supabase
      .from("profiles")
      .select("organisation_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return { error: "Profil non trouvé" };
    }

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
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

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
