"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";

/**
 * Reschedule a mission to a new date/time via drag & drop on the calendar.
 */
export async function rescheduleMission(
  missionId: string,
  newScheduledAt: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) {
      return errorResponse("Non autorisé");
    }

    // Validate missionId is a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!missionId || !uuidRegex.test(missionId)) {
      return errorResponse("ID de mission invalide");
    }

    // Validate the date
    const parsedDate = new Date(newScheduledAt);
    if (isNaN(parsedDate.getTime())) {
      return errorResponse("Date invalide");
    }

    // Don't allow scheduling in the past (more than 1 day ago)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (parsedDate < yesterday) {
      return errorResponse("Impossible de planifier une mission dans le passé");
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("missions")
      .update({
        scheduled_at: parsedDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", missionId)
      .eq("organisation_id", profile.organisation_id);

    if (error) {
      return errorResponse(error.message);
    }

    revalidatePath("/calendrier");
    revalidatePath("/missions");
    return successResponse("Mission replanifiée avec succès");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la replanification"
    );
  }
}
