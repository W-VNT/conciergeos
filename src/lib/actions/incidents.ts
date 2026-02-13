"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { incidentSchema, type IncidentFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createIncident(data: IncidentFormData) {
  const profile = await requireProfile();
  const parsed = incidentSchema.parse(data);
  const supabase = createClient();

  const { error } = await supabase.from("incidents").insert({
    organisation_id: profile.organisation_id,
    logement_id: parsed.logement_id,
    mission_id: parsed.mission_id || null,
    prestataire_id: parsed.prestataire_id || null,
    severity: parsed.severity,
    status: parsed.status,
    description: parsed.description,
    cost: parsed.cost || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/incidents");
  redirect("/incidents");
}

export async function updateIncident(id: string, data: IncidentFormData) {
  await requireProfile();
  const parsed = incidentSchema.parse(data);
  const supabase = createClient();

  const updateData: Record<string, unknown> = {
    logement_id: parsed.logement_id,
    mission_id: parsed.mission_id || null,
    prestataire_id: parsed.prestataire_id || null,
    severity: parsed.severity,
    status: parsed.status,
    description: parsed.description,
    cost: parsed.cost || null,
  };

  if (parsed.status === "RESOLU" || parsed.status === "CLOS") {
    updateData.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("incidents")
    .update(updateData)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/incidents");
  redirect(`/incidents/${id}`);
}

export async function deleteIncident(id: string) {
  await requireProfile();
  const supabase = createClient();

  const { error } = await supabase.from("incidents").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/incidents");
  redirect("/incidents");
}
