"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { proprietaireSchema, type ProprietaireFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toTitleCase } from "@/lib/utils";

export async function createProprietaire(data: ProprietaireFormData) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) throw new Error("Non autorisé");

  const parsed = proprietaireSchema.parse(data);
  const supabase = createClient();

  const { error } = await supabase.from("proprietaires").insert({
    organisation_id: profile.organisation_id,
    full_name: toTitleCase(parsed.full_name),
    phone: parsed.phone || null,
    email: parsed.email || null,
    address_line1: parsed.address_line1 || null,
    postal_code: parsed.postal_code || null,
    city: parsed.city || null,
    statut_juridique: parsed.statut_juridique,
    siret: parsed.siret || null,
    notes: parsed.notes || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/proprietaires");
  redirect("/proprietaires");
}

export async function updateProprietaire(id: string, data: ProprietaireFormData) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) throw new Error("Non autorisé");

  const parsed = proprietaireSchema.parse(data);
  const supabase = createClient();

  const { error } = await supabase
    .from("proprietaires")
    .update({
      full_name: toTitleCase(parsed.full_name),
      phone: parsed.phone || null,
      email: parsed.email || null,
      address_line1: parsed.address_line1 || null,
      postal_code: parsed.postal_code || null,
      city: parsed.city || null,
      statut_juridique: parsed.statut_juridique,
      siret: parsed.siret || null,
      notes: parsed.notes || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/proprietaires");
  redirect(`/proprietaires/${id}`);
}

export async function deleteProprietaire(id: string) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) throw new Error("Non autorisé");

  const supabase = createClient();
  const { error } = await supabase.from("proprietaires").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/proprietaires");
  redirect("/proprietaires");
}
