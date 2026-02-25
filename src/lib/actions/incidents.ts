"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { incidentSchema, type IncidentFormData } from "@/lib/schemas";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import { logActivity } from "@/lib/actions/activity-logs";

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
      category: parsed.category || null,
      description: parsed.description,
      cost: parsed.cost || null,
      notes: parsed.notes || null,
      expected_resolution_date: parsed.expected_resolution_date || null,
    }).select("id").single();

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    // Log creation activity
    await logActivity({
      entityType: "INCIDENT",
      entityId: created.id,
      action: "CREATED",
    });

    revalidatePath("/incidents");
    return successResponse("Incident créé avec succès", { id: created.id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la création de l'incident") as ActionResponse<{ id: string }>;
  }
}

export async function updateIncident(id: string, data: IncidentFormData): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    const parsed = incidentSchema.parse(data);
    const supabase = createClient();

    // Fetch current incident to detect changes for logging
    const { data: existing } = await supabase
      .from("incidents")
      .select("status, prestataire_id, prestataire:prestataires(full_name)")
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id)
      .single();

    const updateData: Record<string, unknown> = {
      logement_id: parsed.logement_id,
      mission_id: parsed.mission_id || null,
      prestataire_id: parsed.prestataire_id || null,
      severity: parsed.severity,
      status: parsed.status,
      category: parsed.category || null,
      description: parsed.description,
      cost: parsed.cost || null,
      notes: parsed.notes || null,
      expected_resolution_date: parsed.expected_resolution_date || null,
    };

    if (parsed.status === "RESOLU" || parsed.status === "CLOS") {
      updateData.resolved_at = new Date().toISOString();
    } else {
      updateData.resolved_at = null;
    }

    const { error } = await supabase
      .from("incidents")
      .update(updateData)
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    // Log activity for status changes
    if (existing && existing.status !== parsed.status) {
      await logActivity({
        entityType: "INCIDENT",
        entityId: id,
        action: "STATUS_CHANGED",
        oldValue: existing.status,
        newValue: parsed.status,
      });
    }

    // Log activity for prestataire assignment changes
    if (existing && existing.prestataire_id !== (parsed.prestataire_id || null) && parsed.prestataire_id) {
      // Fetch new prestataire name
      const { data: newPrestataire } = await supabase
        .from("prestataires")
        .select("full_name")
        .eq("id", parsed.prestataire_id)
        .single();

      await logActivity({
        entityType: "INCIDENT",
        entityId: id,
        action: "ASSIGNED",
        oldValue: (existing.prestataire as { full_name?: string } | null)?.full_name ?? null,
        newValue: newPrestataire?.full_name ?? parsed.prestataire_id,
      });
    }

    // Log general update if no specific changes were logged
    if (existing && existing.status === parsed.status && existing.prestataire_id === (parsed.prestataire_id || null)) {
      await logActivity({
        entityType: "INCIDENT",
        entityId: id,
        action: "UPDATED",
      });
    }

    revalidatePath("/incidents");
    revalidatePath(`/incidents/${id}`);
    return successResponse("Incident mis à jour avec succès", { id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la mise à jour de l'incident") as ActionResponse<{ id: string }>;
  }
}

export async function updateIncidentStatus(id: string, status: string) {
  const profile = await requireProfile();
  const validatedStatus = z.enum(['OUVERT', 'EN_COURS', 'RESOLU', 'CLOS']).parse(status);
  const supabase = createClient();

  // Fetch old status for logging
  const { data: existing } = await supabase
    .from("incidents")
    .select("status")
    .eq("id", id)
    .eq("organisation_id", profile.organisation_id)
    .single();

  const updateData: Record<string, unknown> = { status: validatedStatus };
  if (status === "RESOLU" || status === "CLOS") {
    updateData.resolved_at = new Date().toISOString();
  } else {
    updateData.resolved_at = null;
  }

  const { error } = await supabase
    .from("incidents")
    .update(updateData)
    .eq("id", id)
    .eq("organisation_id", profile.organisation_id);

  if (error) throw new Error(error.message);

  // Log status change
  if (existing && existing.status !== validatedStatus) {
    await logActivity({
      entityType: "INCIDENT",
      entityId: id,
      action: "STATUS_CHANGED",
      oldValue: existing.status,
      newValue: validatedStatus,
    });
  }

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${id}`);
}

export async function deleteIncident(id: string): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé");
    const supabase = createClient();

    const { error } = await supabase.from("incidents").delete().eq("id", id).eq("organisation_id", profile.organisation_id);
    if (error) return errorResponse(error.message);

    revalidatePath("/incidents");
    return successResponse("Incident supprimé avec succès");
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la suppression de l'incident");
  }
}

export async function bulkCloseIncidents(incidentIds: string[]): Promise<ActionResponse<{ count: number }>> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé") as ActionResponse<{ count: number }>;
    const validatedIds = z.array(z.string().uuid()).min(1).max(100).parse(incidentIds);
    const supabase = createClient();

    const { error, count } = await supabase
      .from("incidents")
      .update({
        status: "CLOS",
        resolved_at: new Date().toISOString()
      })
      .in("id", validatedIds)
      .eq("organisation_id", profile.organisation_id);

    if (error) {
      console.error("Bulk close incidents error:", error);
      return errorResponse("Erreur lors de la clôture") as ActionResponse<{ count: number }>;
    }

    revalidatePath("/incidents");

    return successResponse(
      `${count} incident${count && count > 1 ? "s" : ""} clôturé${count && count > 1 ? "s" : ""} avec succès`,
      { count: count || 0 }
    );
  } catch (err) {
    console.error("Bulk close error:", err);
    return errorResponse((err as Error).message ?? "Erreur lors de la clôture") as ActionResponse<{ count: number }>;
  }
}

export async function bulkAssignIncidents(data: {
  incident_ids: string[];
  prestataire_id: string;
}): Promise<ActionResponse<{ count: number }>> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé") as ActionResponse<{ count: number }>;
    const validatedIds = z.array(z.string().uuid()).min(1).max(100).parse(data.incident_ids);
    const supabase = createClient();

    // Vérifier que le prestataire existe et appartient à l'organisation
    const { data: prestataire, error: prestataireError } = await supabase
      .from("prestataires")
      .select("id, full_name")
      .eq("id", data.prestataire_id)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (prestataireError || !prestataire) {
      return errorResponse("Prestataire non trouvé") as ActionResponse<{ count: number }>;
    }

    const { error, count } = await supabase
      .from("incidents")
      .update({ prestataire_id: data.prestataire_id })
      .in("id", validatedIds)
      .eq("organisation_id", profile.organisation_id);

    if (error) {
      console.error("Bulk assign incidents error:", error);
      return errorResponse("Erreur lors de l'assignation") as ActionResponse<{ count: number }>;
    }

    revalidatePath("/incidents");

    return successResponse(
      `${count} incident${count && count > 1 ? "s" : ""} assigné${count && count > 1 ? "s" : ""} à ${prestataire.full_name}`,
      { count: count || 0 }
    );
  } catch (err) {
    console.error("Bulk assign error:", err);
    return errorResponse((err as Error).message ?? "Erreur lors de l'assignation") as ActionResponse<{ count: number }>;
  }
}

export async function bulkDeleteIncidents(incidentIds: string[]): Promise<ActionResponse<{ count: number }>> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé") as ActionResponse<{ count: number }>;
    const validatedIds = z.array(z.string().uuid()).min(1).max(100).parse(incidentIds);
    const supabase = createClient();

    const { error, count } = await supabase
      .from("incidents")
      .delete({ count: "exact" })
      .in("id", validatedIds)
      .eq("organisation_id", profile.organisation_id);

    if (error) {
      console.error("Bulk delete incidents error:", error);
      return errorResponse("Erreur lors de la suppression") as ActionResponse<{ count: number }>;
    }

    revalidatePath("/incidents");

    return successResponse(
      `${count} incident${count && count > 1 ? "s" : ""} supprimé${count && count > 1 ? "s" : ""} avec succès`,
      { count: count || 0 }
    );
  } catch (err) {
    console.error("Bulk delete error:", err);
    return errorResponse((err as Error).message ?? "Erreur lors de la suppression") as ActionResponse<{ count: number }>;
  }
}
