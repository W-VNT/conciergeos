"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { EquipementCategorie, EquipementEtat } from "@/types/database";

interface CreateEquipementData {
  logement_id: string;
  categorie: EquipementCategorie;
  nom: string;
  quantite: number;
  etat: EquipementEtat;
  notes?: string;
}

interface UpdateEquipementData {
  categorie?: EquipementCategorie;
  nom?: string;
  quantite?: number;
  etat?: EquipementEtat;
  notes?: string;
}

/**
 * Get all equipements for a logement
 */
export async function getEquipements(logementId: string) {
  try {
    const profile = await requireProfile();
    const supabase = await createClient();

    const { data: equipements, error } = await supabase
      .from("equipements")
      .select("*")
      .eq("logement_id", logementId)
      .eq("organisation_id", profile.organisation_id)
      .order("categorie", { ascending: true })
      .order("nom", { ascending: true });

    if (error) {
      console.error("Get equipements error:", error);
      return { error: "Erreur lors de la récupération des équipements" };
    }

    return { equipements };
  } catch (error) {
    console.error("Get equipements error:", error);
    return { error: "Une erreur est survenue" };
  }
}

/**
 * Create a new equipement
 */
export async function createEquipement(data: CreateEquipementData) {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return { error: "Non autorisé" };

    const supabase = await createClient();

    // Verify logement belongs to this organisation
    const { data: logement } = await supabase
      .from("logements")
      .select("id")
      .eq("id", data.logement_id)
      .eq("organisation_id", profile.organisation_id)
      .single();
    if (!logement) return { error: "Logement non trouvé" };

    const { error } = await supabase.from("equipements").insert({
      organisation_id: profile.organisation_id,
      logement_id: data.logement_id,
      categorie: data.categorie,
      nom: data.nom,
      quantite: data.quantite,
      etat: data.etat,
      notes: data.notes || null,
    });

    if (error) {
      console.error("Create equipement error:", error);
      return { error: "Erreur lors de la création de l'équipement" };
    }

    revalidatePath(`/logements/${data.logement_id}`);

    return { success: true };
  } catch (error) {
    console.error("Create equipement error:", error);
    return { error: "Une erreur est survenue" };
  }
}

/**
 * Update an equipement
 */
export async function updateEquipement(
  equipementId: string,
  data: UpdateEquipementData
) {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return { error: "Non autorisé" };

    const supabase = await createClient();

    // Get the equipement (scoped to org) for revalidation
    const { data: equipement } = await supabase
      .from("equipements")
      .select("logement_id")
      .eq("id", equipementId)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (!equipement) return { error: "Équipement non trouvé" };

    const { error } = await supabase
      .from("equipements")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", equipementId)
      .eq("organisation_id", profile.organisation_id);

    if (error) {
      console.error("Update equipement error:", error);
      return { error: "Erreur lors de la mise à jour de l'équipement" };
    }

    revalidatePath(`/logements/${equipement.logement_id}`);

    return { success: true };
  } catch (error) {
    console.error("Update equipement error:", error);
    return { error: "Une erreur est survenue" };
  }
}

/**
 * Delete an equipement
 */
export async function deleteEquipement(equipementId: string) {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return { error: "Non autorisé" };

    const supabase = await createClient();

    // Get the equipement (scoped to org) for revalidation
    const { data: equipement } = await supabase
      .from("equipements")
      .select("logement_id")
      .eq("id", equipementId)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (!equipement) return { error: "Équipement non trouvé" };

    const { error } = await supabase
      .from("equipements")
      .delete()
      .eq("id", equipementId)
      .eq("organisation_id", profile.organisation_id);

    if (error) {
      console.error("Delete equipement error:", error);
      return { error: "Erreur lors de la suppression de l'équipement" };
    }

    revalidatePath(`/logements/${equipement.logement_id}`);

    return { success: true };
  } catch (error) {
    console.error("Delete equipement error:", error);
    return { error: "Une erreur est survenue" };
  }
}
