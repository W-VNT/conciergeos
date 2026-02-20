"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { logementSchema, type LogementFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";

export async function createLogement(data: LogementFormData): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé");

    const parsed = logementSchema.parse(data);
    const supabase = createClient();

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
      notes: parsed.notes || null,
      status: parsed.status,
    }).select("id").single();

    if (error) return errorResponse(error.message);

    revalidatePath("/logements");
    return successResponse("Logement créé avec succès", { id: created.id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la création du logement");
  }
}

export async function updateLogement(id: string, data: LogementFormData): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé");

    const parsed = logementSchema.parse(data);
    const supabase = createClient();

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
        notes: parsed.notes || null,
        status: parsed.status,
      })
      .eq("id", id);

    if (error) return errorResponse(error.message);

    revalidatePath("/logements");
    revalidatePath(`/logements/${id}`);
    return successResponse("Logement mis à jour avec succès", { id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la mise à jour du logement");
  }
}

export async function deleteLogement(id: string): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé");

    const supabase = createClient();
    const { error } = await supabase.from("logements").delete().eq("id", id);
    if (error) return errorResponse(error.message);

    revalidatePath("/logements");
    return successResponse("Logement supprimé avec succès");
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la suppression du logement");
  }
}
