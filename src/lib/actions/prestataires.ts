"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { prestataireSchema, type PrestataireFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPrestataire(data: PrestataireFormData) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) throw new Error("Non autorisé");

  const parsed = prestataireSchema.parse(data);
  const supabase = createClient();

  const { error } = await supabase.from("prestataires").insert({
    organisation_id: profile.organisation_id,
    full_name: parsed.full_name,
    specialty: parsed.specialty,
    phone: parsed.phone || null,
    email: parsed.email || null,
    zone: parsed.zone || null,
    hourly_rate: parsed.hourly_rate || null,
    reliability_score: parsed.reliability_score || null,
    notes: parsed.notes || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/prestataires");
  redirect("/prestataires");
}

export async function updatePrestataire(id: string, data: PrestataireFormData) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) throw new Error("Non autorisé");

  const parsed = prestataireSchema.parse(data);
  const supabase = createClient();

  const { error } = await supabase
    .from("prestataires")
    .update({
      full_name: parsed.full_name,
      specialty: parsed.specialty,
      phone: parsed.phone || null,
      email: parsed.email || null,
      zone: parsed.zone || null,
      hourly_rate: parsed.hourly_rate || null,
      reliability_score: parsed.reliability_score || null,
      notes: parsed.notes || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/prestataires");
  redirect(`/prestataires/${id}`);
}

export async function deletePrestataire(id: string) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) throw new Error("Non autorisé");

  const supabase = createClient();
  const { error } = await supabase.from("prestataires").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/prestataires");
  redirect("/prestataires");
}
