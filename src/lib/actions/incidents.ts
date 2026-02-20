"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { incidentSchema, type IncidentFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";

export async function createIncident(data: IncidentFormData, preGeneratedId?: string): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    const parsed = incidentSchema.parse(data);
    const supabase = createClient();

    const { data: created, error } = await supabase.from("incidents").insert({
      ...(preGeneratedId ? { id: preGeneratedId } : {}),
      organisation_id: profile.organisation_id,
      logement_id: parsed.logement_id,
      mission_id: parsed.mission_id || null,
      prestataire_id: parsed.prestataire_id || null,
      severity: parsed.severity,
      status: parsed.status,
      description: parsed.description,
      cost: parsed.cost || null,
      notes: parsed.notes || null,
      expected_resolution_date: parsed.expected_resolution_date || null,
    }).select("id").single();

    if (error) return errorResponse(error.message);

    revalidatePath("/incidents");
    return successResponse("Incident créé avec succès", { id: created.id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la création de l'incident");
  }
}

export async function updateIncident(id: string, data: IncidentFormData): Promise<ActionResponse<{ id: string }>> {
  try {
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
      notes: parsed.notes || null,
      expected_resolution_date: parsed.expected_resolution_date || null,
    };

    if (parsed.status === "RESOLU" || parsed.status === "CLOS") {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("incidents")
      .update(updateData)
      .eq("id", id);

    if (error) return errorResponse(error.message);

    revalidatePath("/incidents");
    revalidatePath(`/incidents/${id}`);
    return successResponse("Incident mis à jour avec succès", { id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la mise à jour de l'incident");
  }
}

export async function updateIncidentStatus(id: string, status: string) {
  await requireProfile();
  const supabase = createClient();

  const updateData: Record<string, unknown> = { status };
  if (status === "RESOLU" || status === "CLOS") {
    updateData.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("incidents")
    .update(updateData)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/incidents");
  revalidatePath(`/incidents/${id}`);
}

export async function deleteIncident(id: string): Promise<ActionResponse> {
  try {
    await requireProfile();
    const supabase = createClient();

    const { error } = await supabase.from("incidents").delete().eq("id", id);
    if (error) return errorResponse(error.message);

    revalidatePath("/incidents");
    return successResponse("Incident supprimé avec succès");
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la suppression de l'incident");
  }
}
