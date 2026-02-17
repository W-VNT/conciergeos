"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { OfferTier, OfferTierConfig } from "@/types/database";

const DEFAULT_CONFIGS: Record<OfferTier, { name: string; description: string; commission_rate: number; services: string[] }> = {
  ESSENTIEL: {
    name: "Essentiel",
    description: "La gestion essentielle pour démarrer sereinement.",
    commission_rate: 15,
    services: ["Gestion des réservations", "Check-in / Check-out", "Ménage"],
  },
  SERENITE: {
    name: "Sérénité",
    description: "Une gestion complète pour maximiser vos revenus.",
    commission_rate: 20,
    services: ["Gestion des réservations", "Check-in / Check-out", "Ménage", "Gestion des incidents", "Communication voyageurs"],
  },
  SIGNATURE: {
    name: "Signature",
    description: "Le service premium pour une expérience 5 étoiles.",
    commission_rate: 25,
    services: ["Gestion des réservations", "Check-in / Check-out", "Ménage", "Gestion des incidents", "Communication voyageurs", "Optimisation des tarifs", "Accueil personnalisé", "Rapport mensuel"],
  },
};

export async function getOfferConfigs(): Promise<{ configs?: OfferTierConfig[]; error?: string }> {
  const profile = await requireProfile();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("offer_tier_configs")
    .select("*")
    .eq("organisation_id", profile.organisation_id)
    .order("tier");

  if (error) return { error: error.message };

  // Si aucune config en DB, retourner les configs par défaut (sans id)
  if (!data || data.length === 0) {
    const defaults = (["ESSENTIEL", "SERENITE", "SIGNATURE"] as OfferTier[]).map((tier) => ({
      id: "",
      organisation_id: profile.organisation_id,
      tier,
      ...DEFAULT_CONFIGS[tier],
      created_at: "",
      updated_at: "",
    }));
    return { configs: defaults };
  }

  // Compléter les tiers manquants avec les defaults
  const tiers: OfferTier[] = ["ESSENTIEL", "SERENITE", "SIGNATURE"];
  const configs: OfferTierConfig[] = tiers.map((tier) => {
    const existing = data.find((d) => d.tier === tier);
    if (existing) return existing as OfferTierConfig;
    return {
      id: "",
      organisation_id: profile.organisation_id,
      tier,
      ...DEFAULT_CONFIGS[tier],
      created_at: "",
      updated_at: "",
    };
  });

  return { configs };
}

export async function upsertOfferConfig(data: {
  tier: OfferTier;
  name: string;
  description: string;
  commission_rate: number;
  services: string[];
}): Promise<{ error?: string }> {
  const profile = await requireProfile();
  if (!isAdmin(profile)) return { error: "Accès refusé" };

  const supabase = createClient();
  const { error } = await supabase
    .from("offer_tier_configs")
    .upsert(
      {
        organisation_id: profile.organisation_id,
        tier: data.tier,
        name: data.name,
        description: data.description,
        commission_rate: data.commission_rate,
        services: data.services,
      },
      { onConflict: "organisation_id,tier" }
    );

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return {};
}
