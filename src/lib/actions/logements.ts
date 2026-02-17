"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { logementSchema, type LogementFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createLogement(data: LogementFormData) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) throw new Error("Non autorisé");

  const parsed = logementSchema.parse(data);
  const supabase = createClient();

  const { error } = await supabase.from("logements").insert({
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
  });

  if (error) throw new Error(error.message);
  revalidatePath("/logements");
  redirect("/logements");
}

export async function updateLogement(id: string, data: LogementFormData) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) throw new Error("Non autorisé");

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

  if (error) throw new Error(error.message);
  revalidatePath("/logements");
  redirect(`/logements/${id}`);
}

export async function deleteLogement(id: string) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) throw new Error("Non autorisé");

  const supabase = createClient();
  const { error } = await supabase.from("logements").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/logements");
  redirect("/logements");
}
