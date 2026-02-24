"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { pricingSeasonSchema, type PricingSeasonFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import type { PricingSeason } from "@/types/database";

export async function getPricingSeasons(
  logementId: string
): Promise<ActionResponse<{ seasons: PricingSeason[] }>> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    const { data, error } = await supabase
      .from("pricing_seasons")
      .select("*")
      .eq("logement_id", logementId)
      .eq("organisation_id", profile.organisation_id)
      .order("start_month", { ascending: true });

    if (error) return errorResponse(error.message) as ActionResponse<{ seasons: PricingSeason[] }>;

    return successResponse("Saisons tarifaires récupérées", { seasons: data ?? [] });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la récupération des saisons tarifaires"
    ) as ActionResponse<{ seasons: PricingSeason[] }>;
  }
}

export async function createPricingSeason(
  data: PricingSeasonFormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = pricingSeasonSchema.parse(data);
    const supabase = createClient();

    const { data: created, error } = await supabase
      .from("pricing_seasons")
      .insert({
        organisation_id: profile.organisation_id,
        logement_id: parsed.logement_id,
        name: parsed.name,
        start_month: parsed.start_month,
        end_month: parsed.end_month,
        price_per_night: parsed.price_per_night,
      })
      .select("id")
      .single();

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath(`/logements/${parsed.logement_id}`);
    return successResponse("Saison tarifaire créée avec succès", { id: created.id });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la création de la saison tarifaire"
    ) as ActionResponse<{ id: string }>;
  }
}

export async function updatePricingSeason(
  id: string,
  data: PricingSeasonFormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = pricingSeasonSchema.parse(data);
    const supabase = createClient();

    const { error } = await supabase
      .from("pricing_seasons")
      .update({
        name: parsed.name,
        start_month: parsed.start_month,
        end_month: parsed.end_month,
        price_per_night: parsed.price_per_night,
      })
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath(`/logements/${parsed.logement_id}`);
    return successResponse("Saison tarifaire mise à jour avec succès", { id });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la mise à jour de la saison tarifaire"
    ) as ActionResponse<{ id: string }>;
  }
}

export async function deletePricingSeason(id: string): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé");

    const supabase = createClient();

    // Fetch the season first to get logement_id for revalidation
    const { data: season } = await supabase
      .from("pricing_seasons")
      .select("logement_id")
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id)
      .single();

    const { error } = await supabase
      .from("pricing_seasons")
      .delete()
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    if (season) {
      revalidatePath(`/logements/${season.logement_id}`);
    }
    return successResponse("Saison tarifaire supprimée avec succès");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la suppression de la saison tarifaire"
    );
  }
}

export async function getCurrentPrice(
  logementId: string
): Promise<ActionResponse<{ price: number | null; seasonName: string | null }>> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    const currentMonth = new Date().getMonth() + 1; // 1-12

    const { data: seasons, error } = await supabase
      .from("pricing_seasons")
      .select("*")
      .eq("logement_id", logementId)
      .eq("organisation_id", profile.organisation_id);

    if (error)
      return errorResponse(error.message) as ActionResponse<{
        price: number | null;
        seasonName: string | null;
      }>;

    // Find the season that covers the current month
    // Handles wrap-around (e.g., start_month=11, end_month=2 covers Nov-Feb)
    const activeSeason = (seasons ?? []).find((s) => {
      if (s.start_month <= s.end_month) {
        return currentMonth >= s.start_month && currentMonth <= s.end_month;
      }
      // Wrap-around case
      return currentMonth >= s.start_month || currentMonth <= s.end_month;
    });

    return successResponse("Prix actuel récupéré", {
      price: activeSeason ? Number(activeSeason.price_per_night) : null,
      seasonName: activeSeason ? activeSeason.name : null,
    });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la récupération du prix actuel"
    ) as ActionResponse<{ price: number | null; seasonName: string | null }>;
  }
}
