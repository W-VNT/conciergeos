"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { contratSchema, type ContratFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createContrat(data: ContratFormData) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) throw new Error("Non autorisé");

  const parsed = contratSchema.parse(data);
  const supabase = createClient();

  const { error } = await supabase.from("contrats").insert({
    organisation_id: profile.organisation_id,
    proprietaire_id: parsed.proprietaire_id,
    logement_id: parsed.logement_id || null,
    type: parsed.type,
    start_date: parsed.start_date,
    end_date: parsed.end_date,
    commission_rate: parsed.commission_rate,
    status: parsed.status,
    conditions: parsed.conditions || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/contrats");
  redirect("/contrats");
}

export async function updateContrat(id: string, data: ContratFormData) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) throw new Error("Non autorisé");

  const parsed = contratSchema.parse(data);
  const supabase = createClient();

  const { error } = await supabase
    .from("contrats")
    .update({
      proprietaire_id: parsed.proprietaire_id,
      logement_id: parsed.logement_id || null,
      type: parsed.type,
      start_date: parsed.start_date,
      end_date: parsed.end_date,
      commission_rate: parsed.commission_rate,
      status: parsed.status,
      conditions: parsed.conditions || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/contrats");
  redirect(`/contrats/${id}`);
}

export async function deleteContrat(id: string) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) throw new Error("Non autorisé");

  const supabase = createClient();
  const { error } = await supabase.from("contrats").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/contrats");
  redirect("/contrats");
}

export async function markContratAsSigned(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("contrats")
    .update({
      status: "SIGNE",
      pdf_downloaded_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("pdf_downloaded_at", null); // Only set once (first download)

  if (error) throw new Error(error.message);
  revalidatePath(`/contrats/${id}`);
  revalidatePath("/contrats");
}
