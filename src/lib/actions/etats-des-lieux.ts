"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdminOrManager, isAdmin } from "@/lib/auth";
import {
  etatDesLieuxSchema,
  etatDesLieuxItemSchema,
  type EtatDesLieuxFormData,
  type EtatDesLieuxItemFormData,
} from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import {
  type ActionResponse,
  successResponse,
  errorResponse,
} from "@/lib/action-response";

// ── List ────────────────────────────────────────────────────────
export async function getEtatsDesLieux(logementId?: string) {
  const profile = await requireProfile();
  const supabase = createClient();

  let query = supabase
    .from("etats_des_lieux")
    .select("*, logement:logements(id, name), reservation:reservations(id, guest_name)")
    .eq("organisation_id", profile.organisation_id)
    .order("created_at", { ascending: false });

  if (logementId) {
    query = query.eq("logement_id", logementId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getEtatsDesLieux error:", error);
    return [];
  }
  return data ?? [];
}

// ── Single ──────────────────────────────────────────────────────
export async function getEtatDesLieux(id: string) {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("etats_des_lieux")
    .select(
      "*, logement:logements(id, name), reservation:reservations(id, guest_name), inspector:profiles(id, full_name)"
    )
    .eq("id", id)
    .eq("organisation_id", profile.organisation_id)
    .single();

  if (error || !data) return null;

  // Fetch items separately
  const { data: items } = await supabase
    .from("etat_des_lieux_items")
    .select("*")
    .eq("etat_des_lieux_id", id)
    .order("position");

  return { ...data, items: items ?? [] };
}

// ── Create ──────────────────────────────────────────────────────
export async function createEtatDesLieux(
  data: EtatDesLieuxFormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile))
      return errorResponse("Non autorise") as ActionResponse<{ id: string }>;

    const parsed = etatDesLieuxSchema.parse(data);
    const supabase = createClient();

    const { data: created, error } = await supabase
      .from("etats_des_lieux")
      .insert({
        organisation_id: profile.organisation_id,
        logement_id: parsed.logement_id,
        reservation_id: parsed.reservation_id || null,
        type: parsed.type,
        status: "BROUILLON",
        inspector_id: profile.id,
        notes: parsed.notes || null,
      })
      .select("id")
      .single();

    if (error)
      return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/etats-des-lieux");
    return successResponse("État des lieux créé avec succès", {
      id: created.id,
    });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la création"
    ) as ActionResponse<{ id: string }>;
  }
}

// ── Add Item ────────────────────────────────────────────────────
export async function addEtatDesLieuxItem(
  etatId: string,
  data: EtatDesLieuxItemFormData
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    // Verify ownership
    const { data: edl } = await supabase
      .from("etats_des_lieux")
      .select("id")
      .eq("id", etatId)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (!edl) return errorResponse("État des lieux non trouvé");

    const parsed = etatDesLieuxItemSchema.parse(data);

    // Get the next position
    const { data: lastItem } = await supabase
      .from("etat_des_lieux_items")
      .select("position")
      .eq("etat_des_lieux_id", etatId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextPosition = (lastItem?.position ?? -1) + 1;

    const { error } = await supabase.from("etat_des_lieux_items").insert({
      etat_des_lieux_id: etatId,
      room: parsed.room,
      element: parsed.element,
      condition: parsed.condition,
      notes: parsed.notes || null,
      position: nextPosition,
    });

    if (error) return errorResponse(error.message);

    revalidatePath(`/etats-des-lieux/${etatId}`);
    return successResponse("Élément ajouté avec succès");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de l'ajout de l'élément"
    );
  }
}

// ── Update Item ─────────────────────────────────────────────────
export async function updateEtatDesLieuxItem(
  itemId: string,
  data: EtatDesLieuxItemFormData
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    // Verify ownership through parent
    const { data: item } = await supabase
      .from("etat_des_lieux_items")
      .select("etat_des_lieux_id")
      .eq("id", itemId)
      .single();

    if (!item) return errorResponse("Élément non trouvé");

    const { data: edl } = await supabase
      .from("etats_des_lieux")
      .select("id")
      .eq("id", item.etat_des_lieux_id)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (!edl) return errorResponse("Non autorisé");

    const parsed = etatDesLieuxItemSchema.parse(data);

    const { error } = await supabase
      .from("etat_des_lieux_items")
      .update({
        room: parsed.room,
        element: parsed.element,
        condition: parsed.condition,
        notes: parsed.notes || null,
      })
      .eq("id", itemId);

    if (error) return errorResponse(error.message);

    revalidatePath(`/etats-des-lieux/${item.etat_des_lieux_id}`);
    return successResponse("Élément mis à jour avec succès");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la mise à jour"
    );
  }
}

// ── Delete Item ─────────────────────────────────────────────────
export async function deleteEtatDesLieuxItem(
  itemId: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    // Verify ownership through parent
    const { data: item } = await supabase
      .from("etat_des_lieux_items")
      .select("etat_des_lieux_id")
      .eq("id", itemId)
      .single();

    if (!item) return errorResponse("Élément non trouvé");

    const { data: edl } = await supabase
      .from("etats_des_lieux")
      .select("id")
      .eq("id", item.etat_des_lieux_id)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (!edl) return errorResponse("Non autorisé");

    const { error } = await supabase
      .from("etat_des_lieux_items")
      .delete()
      .eq("id", itemId);

    if (error) return errorResponse(error.message);

    revalidatePath(`/etats-des-lieux/${item.etat_des_lieux_id}`);
    return successResponse("Élément supprimé avec succès");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la suppression"
    );
  }
}

// ── Sign ────────────────────────────────────────────────────────
export async function signEtatDesLieux(
  id: string,
  signatureType: "guest" | "inspector",
  signatureUrl: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    const updateData: Record<string, unknown> =
      signatureType === "guest"
        ? { guest_signature_url: signatureUrl }
        : { inspector_signature_url: signatureUrl };

    // Check if both signatures are present after this update, then mark as SIGNE
    const { data: edl } = await supabase
      .from("etats_des_lieux")
      .select("guest_signature_url, inspector_signature_url")
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (!edl) return errorResponse("État des lieux non trouvé");

    const otherSig =
      signatureType === "guest"
        ? edl.inspector_signature_url
        : edl.guest_signature_url;

    if (otherSig || signatureUrl) {
      updateData.status = "SIGNE";
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("etats_des_lieux")
      .update(updateData)
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath(`/etats-des-lieux/${id}`);
    revalidatePath("/etats-des-lieux");
    return successResponse("Signature enregistrée avec succès");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la signature"
    );
  }
}

// ── Validate (admin only) ───────────────────────────────────────
export async function validateEtatDesLieux(
  id: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Réservé aux administrateurs");

    const supabase = createClient();

    const { error } = await supabase
      .from("etats_des_lieux")
      .update({ status: "VALIDE" })
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath(`/etats-des-lieux/${id}`);
    revalidatePath("/etats-des-lieux");
    return successResponse("État des lieux validé avec succès");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la validation"
    );
  }
}
