"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { missionSchema, type MissionFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";

export async function createMission(data: MissionFormData): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    const parsed = missionSchema.parse(data);
    const supabase = createClient();

    // Combine date and time
    const scheduled_at = `${parsed.scheduled_date}T${parsed.scheduled_time}:00`;

    const { data: created, error } = await supabase.from("missions").insert({
      organisation_id: profile.organisation_id,
      logement_id: parsed.logement_id,
      assigned_to: parsed.assigned_to || null,
      type: parsed.type,
      status: parsed.status,
      priority: parsed.priority,
      scheduled_at,
      time_spent_minutes: parsed.time_spent_minutes || null,
      notes: parsed.notes || null,
    }).select("id").single();

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/missions");
    return successResponse("Mission créée avec succès", { id: created.id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la création de la mission") as ActionResponse<{ id: string }>;
  }
}

export async function updateMission(id: string, data: MissionFormData): Promise<ActionResponse<{ id: string }>> {
  try {
    await requireProfile();
    const parsed = missionSchema.parse(data);
    const supabase = createClient();

    // Combine date and time
    const scheduled_at = `${parsed.scheduled_date}T${parsed.scheduled_time}:00`;

    const updateData: Record<string, unknown> = {
      logement_id: parsed.logement_id,
      assigned_to: parsed.assigned_to || null,
      type: parsed.type,
      status: parsed.status,
      priority: parsed.priority,
      scheduled_at,
      time_spent_minutes: parsed.time_spent_minutes || null,
      notes: parsed.notes || null,
    };

    if (parsed.status === "TERMINE") {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("missions")
      .update(updateData)
      .eq("id", id);

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/missions");
    revalidatePath(`/missions/${id}`);
    return successResponse("Mission mise à jour avec succès", { id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la mise à jour de la mission") as ActionResponse<{ id: string }>;
  }
}

export async function completeMission(id: string) {
  await requireProfile();
  const supabase = createClient();

  const { error } = await supabase
    .from("missions")
    .update({
      status: "TERMINE",
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/missions");
  revalidatePath("/dashboard");
}

export async function deleteMission(id: string): Promise<ActionResponse> {
  try {
    await requireProfile();
    const supabase = createClient();

    const { error } = await supabase.from("missions").delete().eq("id", id);
    if (error) return errorResponse(error.message);

    revalidatePath("/missions");
    revalidatePath("/dashboard");
    return successResponse("Mission supprimée avec succès");
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la suppression de la mission");
  }
}
