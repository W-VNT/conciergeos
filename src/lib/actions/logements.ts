"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { logementSchema, type LogementFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";

export async function createLogement(data: LogementFormData): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = logementSchema.parse(data);
    const supabase = await createClient();

    const { data: created, error } = await supabase.from("logements").insert({
      organisation_id: profile.organisation_id,
      name: parsed.name,
      owner_id: parsed.owner_id || null,
      address_line1: parsed.address_line1 || null,
      city: parsed.city || null,
      postal_code: parsed.postal_code || null,
      country: parsed.country || null,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      offer_tier: parsed.offer_tier,
      lockbox_code: parsed.lockbox_code || null,
      wifi_name: parsed.wifi_name || null,
      wifi_password: parsed.wifi_password || null,
      bedrooms: parsed.bedrooms,
      beds: parsed.beds,
      max_guests: parsed.max_guests,
      menage_price: parsed.menage_price,
      tags: parsed.tags.length > 0 ? parsed.tags : null,
      notes: parsed.notes || null,
      ical_url: parsed.ical_url || null,
      status: parsed.status,
    }).select("id").single();

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/logements");
    return successResponse("Logement créé avec succès", { id: created.id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la création du logement") as ActionResponse<{ id: string }>;
  }
}

export async function updateLogement(id: string, data: LogementFormData): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = logementSchema.parse(data);
    const supabase = await createClient();

    const { error } = await supabase
      .from("logements")
      .update({
        name: parsed.name,
        owner_id: parsed.owner_id || null,
        address_line1: parsed.address_line1 || null,
        city: parsed.city || null,
        postal_code: parsed.postal_code || null,
        country: parsed.country || null,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        offer_tier: parsed.offer_tier,
        lockbox_code: parsed.lockbox_code || null,
        wifi_name: parsed.wifi_name || null,
        wifi_password: parsed.wifi_password || null,
        bedrooms: parsed.bedrooms,
        beds: parsed.beds,
        max_guests: parsed.max_guests,
        menage_price: parsed.menage_price,
        tags: parsed.tags.length > 0 ? parsed.tags : null,
        notes: parsed.notes || null,
        ical_url: parsed.ical_url || null,
        status: parsed.status,
      })
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/logements");
    revalidatePath(`/logements/${id}`);
    return successResponse("Logement mis à jour avec succès", { id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la mise à jour du logement") as ActionResponse<{ id: string }>;
  }
}

export async function deleteLogement(id: string): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé");

    const supabase = await createClient();
    const { error } = await supabase.from("logements").delete().eq("id", id).eq("organisation_id", profile.organisation_id);
    if (error) return errorResponse(error.message);

    revalidatePath("/logements");
    return successResponse("Logement supprimé avec succès");
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la suppression du logement");
  }
}

export async function duplicateLogement(id: string): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const supabase = await createClient();

    // Fetch the original logement
    const { data: original, error: fetchError } = await supabase
      .from("logements")
      .select("*")
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (fetchError || !original) {
      return errorResponse("Logement non trouvé") as ActionResponse<{ id: string }>;
    }

    // Create the duplicate (exclude id, created_at, updated_at, ical_last_synced_at)
    const { data: created, error: insertError } = await supabase
      .from("logements")
      .insert({
        organisation_id: original.organisation_id,
        name: `[Copie] ${original.name}`,
        owner_id: original.owner_id,
        address_line1: original.address_line1,
        city: original.city,
        postal_code: original.postal_code,
        country: original.country,
        latitude: original.latitude,
        longitude: original.longitude,
        offer_tier: original.offer_tier,
        lockbox_code: original.lockbox_code,
        wifi_name: original.wifi_name,
        wifi_password: original.wifi_password,
        bedrooms: original.bedrooms,
        beds: original.beds,
        max_guests: original.max_guests,
        menage_price: original.menage_price,
        tags: original.tags,
        notes: original.notes,
        ical_url: original.ical_url,
        status: original.status,
      })
      .select("id")
      .single();

    if (insertError || !created) {
      return errorResponse(insertError?.message ?? "Erreur lors de la duplication") as ActionResponse<{ id: string }>;
    }

    // Copy equipements from the original logement
    const { data: equipements } = await supabase
      .from("equipements")
      .select("*")
      .eq("logement_id", id)
      .eq("organisation_id", profile.organisation_id);

    if (equipements && equipements.length > 0) {
      const newEquipements = equipements.map((eq) => ({
        organisation_id: eq.organisation_id,
        logement_id: created.id,
        categorie: eq.categorie,
        nom: eq.nom,
        quantite: eq.quantite,
        etat: eq.etat,
        notes: eq.notes,
      }));

      await supabase.from("equipements").insert(newEquipements);
    }

    revalidatePath("/logements");
    return successResponse("Logement dupliqué avec succès", { id: created.id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la duplication du logement") as ActionResponse<{ id: string }>;
  }
}

export async function archiveLogement(id: string): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé");

    const supabase = await createClient();

    // Set logement status to ARCHIVE
    const { error } = await supabase
      .from("logements")
      .update({ status: "ARCHIVE" })
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    // Cancel all A_FAIRE missions for this logement
    await supabase
      .from("missions")
      .update({ status: "ANNULE" })
      .eq("logement_id", id)
      .eq("organisation_id", profile.organisation_id)
      .eq("status", "A_FAIRE");

    revalidatePath("/logements");
    revalidatePath("/missions");
    revalidatePath(`/logements/${id}`);
    return successResponse("Logement archivé avec succès");
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de l'archivage du logement");
  }
}

export async function reactivateLogement(id: string): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé");

    const supabase = await createClient();

    const { error } = await supabase
      .from("logements")
      .update({ status: "ACTIF" })
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath("/logements");
    revalidatePath(`/logements/${id}`);
    return successResponse("Logement réactivé avec succès");
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la réactivation du logement");
  }
}

export async function bulkDeleteLogements(logementIds: string[]): Promise<ActionResponse<{ count: number }>> {
  try {
    if (!logementIds.length || logementIds.length > 100) {
      return errorResponse("Nombre de logements invalide (max 100)") as ActionResponse<{ count: number }>;
    }

    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ count: number }>;

    const supabase = await createClient();

    const { error, count } = await supabase
      .from("logements")
      .delete({ count: "exact" })
      .in("id", logementIds)
      .eq("organisation_id", profile.organisation_id);

    if (error) {
      console.error("Bulk delete logements error:", error);
      return errorResponse("Erreur lors de la suppression") as ActionResponse<{ count: number }>;
    }

    revalidatePath("/logements");

    return successResponse(
      `${count} logement${count && count > 1 ? "s" : ""} supprimé${count && count > 1 ? "s" : ""} avec succès`,
      { count: count || 0 }
    );
  } catch (err) {
    console.error("Bulk delete error:", err);
    return errorResponse((err as Error).message ?? "Erreur lors de la suppression") as ActionResponse<{ count: number }>;
  }
}
