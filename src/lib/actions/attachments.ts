"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";

// ── Schemas ──────────────────────────────────────────────────────

const captionSchema = z.object({
  id: z.string().uuid(),
  caption: z.string().max(500),
});

const setMainSchema = z.object({
  id: z.string().uuid(),
  entityType: z.enum(["LOGEMENT", "MISSION", "INCIDENT", "CONTRAT"]),
  entityId: z.string().uuid(),
});

const positionUpdateSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string().uuid(),
        position: z.number().int().min(0),
      })
    )
    .min(1)
    .max(200),
});

// ── Actions ──────────────────────────────────────────────────────

/**
 * Update the caption of an attachment
 */
export async function updateAttachmentCaption(
  id: string,
  caption: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    const parsed = captionSchema.parse({ id, caption });
    const supabase = createClient();

    const { error } = await supabase
      .from("attachments")
      .update({ caption: parsed.caption || null })
      .eq("id", parsed.id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath("/logements");
    revalidatePath("/missions");
    revalidatePath("/incidents");
    return successResponse("Légende mise à jour");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la mise à jour de la légende"
    );
  }
}

/**
 * Set an attachment as the main (cover) photo.
 * Unsets is_main on all other attachments for the same entity.
 */
export async function setAttachmentAsMain(
  id: string,
  entityType: string,
  entityId: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    const parsed = setMainSchema.parse({ id, entityType, entityId });
    const supabase = createClient();

    // First, unset is_main on all attachments for this entity
    const { error: unsetError } = await supabase
      .from("attachments")
      .update({ is_main: false })
      .eq("entity_type", parsed.entityType)
      .eq("entity_id", parsed.entityId)
      .eq("organisation_id", profile.organisation_id);

    if (unsetError) return errorResponse(unsetError.message);

    // Then set the selected one as main
    const { error: setError } = await supabase
      .from("attachments")
      .update({ is_main: true })
      .eq("id", parsed.id)
      .eq("organisation_id", profile.organisation_id);

    if (setError) return errorResponse(setError.message);

    revalidatePath("/logements");
    revalidatePath("/missions");
    revalidatePath("/incidents");
    return successResponse("Photo principale définie");
  } catch (err) {
    return errorResponse(
      (err as Error).message ??
        "Erreur lors de la définition de la photo principale"
    );
  }
}

/**
 * Batch update positions for attachments (used after drag & drop reorder)
 */
export async function updateAttachmentPositions(
  updates: { id: string; position: number }[]
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    const parsed = positionUpdateSchema.parse({ updates });
    const supabase = createClient();

    // Update each attachment position
    const results = await Promise.all(
      parsed.updates.map(({ id, position }) =>
        supabase
          .from("attachments")
          .update({ position })
          .eq("id", id)
          .eq("organisation_id", profile.organisation_id)
      )
    );

    const firstError = results.find((r) => r.error);
    if (firstError?.error) return errorResponse(firstError.error.message);

    revalidatePath("/logements");
    revalidatePath("/missions");
    revalidatePath("/incidents");
    return successResponse("Ordre des photos mis à jour");
  } catch (err) {
    return errorResponse(
      (err as Error).message ??
        "Erreur lors de la mise à jour de l'ordre des photos"
    );
  }
}
