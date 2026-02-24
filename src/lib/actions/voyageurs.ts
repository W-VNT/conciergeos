"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { voyageurSchema, type VoyageurFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";

export async function getVoyageurs(search?: string) {
  const profile = await requireProfile();
  const supabase = createClient();

  let query = supabase
    .from("voyageurs")
    .select("*")
    .eq("organisation_id", profile.organisation_id)
    .order("full_name");

  if (search) {
    const sanitized = search.replace(/%/g, "\\%").replace(/_/g, "\\_");
    query = query.or(`full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getVoyageurs error:", error);
    return [];
  }
  return data ?? [];
}

export async function getVoyageur(id: string) {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data: voyageur, error } = await supabase
    .from("voyageurs")
    .select("*")
    .eq("id", id)
    .eq("organisation_id", profile.organisation_id)
    .single();

  if (error || !voyageur) return null;

  // Fetch stay history (reservations linked to this voyageur)
  const { data: reservations } = await supabase
    .from("reservations")
    .select("*, logement:logements(id, name, city)")
    .eq("voyageur_id", id)
    .eq("organisation_id", profile.organisation_id)
    .order("check_in_date", { ascending: false });

  return { ...voyageur, reservations: reservations ?? [] };
}

export async function createVoyageur(data: VoyageurFormData): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = voyageurSchema.parse(data);
    const supabase = createClient();

    const { data: voyageur, error } = await supabase
      .from("voyageurs")
      .insert({
        organisation_id: profile.organisation_id,
        full_name: parsed.full_name,
        email: parsed.email || null,
        phone: parsed.phone || null,
        language: parsed.language || null,
        nationality: parsed.nationality || null,
        notes: parsed.notes || null,
        tags: parsed.tags ?? [],
      })
      .select()
      .single();

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/voyageurs");
    return successResponse("Voyageur créé avec succès", { id: voyageur.id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la création du voyageur") as ActionResponse<{ id: string }>;
  }
}

export async function updateVoyageur(id: string, data: VoyageurFormData): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = voyageurSchema.parse(data);
    const supabase = createClient();

    const { error } = await supabase
      .from("voyageurs")
      .update({
        full_name: parsed.full_name,
        email: parsed.email || null,
        phone: parsed.phone || null,
        language: parsed.language || null,
        nationality: parsed.nationality || null,
        notes: parsed.notes || null,
        tags: parsed.tags ?? [],
      })
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/voyageurs");
    revalidatePath(`/voyageurs/${id}`);
    return successResponse("Voyageur mis à jour avec succès", { id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la mise à jour du voyageur") as ActionResponse<{ id: string }>;
  }
}

export async function deleteVoyageur(id: string): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé");

    const supabase = createClient();

    // Unlink reservations first
    await supabase
      .from("reservations")
      .update({ voyageur_id: null })
      .eq("voyageur_id", id)
      .eq("organisation_id", profile.organisation_id);

    const { error } = await supabase
      .from("voyageurs")
      .delete()
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath("/voyageurs");
    return successResponse("Voyageur supprimé avec succès");
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la suppression du voyageur");
  }
}

/**
 * Find an existing voyageur by (org_id, email) or create a new one.
 * Called when creating/updating a reservation.
 * Returns the voyageur id.
 */
export async function findOrCreateVoyageur(
  orgId: string,
  name: string,
  email?: string | null,
  phone?: string | null
): Promise<string | null> {
  try {
    const supabase = createClient();

    // Try to find by email first (if provided)
    if (email) {
      const { data: existing } = await supabase
        .from("voyageurs")
        .select("id")
        .eq("organisation_id", orgId)
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        // Fetch current total_stays and increment
        const { data: current } = await supabase
          .from("voyageurs")
          .select("total_stays")
          .eq("id", existing.id)
          .single();

        await supabase
          .from("voyageurs")
          .update({ total_stays: (current?.total_stays ?? 0) + 1 })
          .eq("id", existing.id);

        return existing.id;
      }
    }

    // Create new voyageur
    const { data: created, error } = await supabase
      .from("voyageurs")
      .insert({
        organisation_id: orgId,
        full_name: name,
        email: email || null,
        phone: phone || null,
        total_stays: 1,
        total_revenue: 0,
        tags: [],
        preferences: {},
      })
      .select("id")
      .single();

    if (error) {
      console.error("findOrCreateVoyageur error:", error);
      return null;
    }

    return created.id;
  } catch (err) {
    console.error("findOrCreateVoyageur error:", err);
    return null;
  }
}
