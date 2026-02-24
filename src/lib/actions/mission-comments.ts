"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { missionCommentSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import type { MissionComment } from "@/types/database";

/**
 * Get all comments for a mission, with author profile (full_name), ordered ASC
 */
export async function getComments(
  missionId: string
): Promise<ActionResponse<MissionComment[]>> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    const { data, error } = await supabase
      .from("mission_comments")
      .select("*, author:profiles(full_name)")
      .eq("mission_id", missionId)
      .eq("organisation_id", profile.organisation_id)
      .order("created_at", { ascending: true });

    if (error) return errorResponse(error.message) as ActionResponse<MissionComment[]>;

    return successResponse("Commentaires chargés", data as MissionComment[]);
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors du chargement des commentaires"
    ) as ActionResponse<MissionComment[]>;
  }
}

/**
 * Add a comment to a mission
 */
export async function addComment(data: {
  mission_id: string;
  content: string;
}): Promise<ActionResponse<MissionComment>> {
  try {
    const profile = await requireProfile();
    const parsed = missionCommentSchema.parse(data);
    const supabase = createClient();

    // Verify mission belongs to the organisation
    const { data: mission, error: missionError } = await supabase
      .from("missions")
      .select("id")
      .eq("id", parsed.mission_id)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (missionError || !mission) {
      return errorResponse("Mission non trouvée") as ActionResponse<MissionComment>;
    }

    const { data: created, error } = await supabase
      .from("mission_comments")
      .insert({
        organisation_id: profile.organisation_id,
        mission_id: parsed.mission_id,
        author_id: profile.id,
        content: parsed.content,
      })
      .select("*, author:profiles(full_name)")
      .single();

    if (error) return errorResponse(error.message) as ActionResponse<MissionComment>;

    revalidatePath(`/missions/${parsed.mission_id}`);
    return successResponse("Commentaire ajouté", created as MissionComment);
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de l'ajout du commentaire"
    ) as ActionResponse<MissionComment>;
  }
}
