"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdminOrManager } from "@/lib/auth";
import {
  prestataireDocumentSchema,
  type PrestataireDocumentFormData,
} from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import {
  type ActionResponse,
  successResponse,
  errorResponse,
} from "@/lib/action-response";
import type { PrestataireDocument } from "@/types/database";

// ── List ────────────────────────────────────────────────────────
export async function getPrestataireDocuments(
  prestataireId: string
): Promise<PrestataireDocument[]> {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("prestataire_documents")
    .select("*")
    .eq("prestataire_id", prestataireId)
    .eq("organisation_id", profile.organisation_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getPrestataireDocuments error:", error);
    return [];
  }
  return (data ?? []) as PrestataireDocument[];
}

// ── Create ──────────────────────────────────────────────────────
export async function createPrestataireDocument(
  data: PrestataireDocumentFormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile))
      return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = prestataireDocumentSchema.parse(data);
    const supabase = createClient();

    // Verify prestataire belongs to this org
    const { data: prestataire } = await supabase
      .from("prestataires")
      .select("id")
      .eq("id", parsed.prestataire_id)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (!prestataire)
      return errorResponse("Prestataire non trouvé") as ActionResponse<{
        id: string;
      }>;

    const { data: created, error } = await supabase
      .from("prestataire_documents")
      .insert({
        prestataire_id: parsed.prestataire_id,
        organisation_id: profile.organisation_id,
        type: parsed.type,
        name: parsed.name,
        file_url: parsed.file_url,
        expires_at: parsed.expires_at || null,
        notes: parsed.notes || null,
      })
      .select("id")
      .single();

    if (error)
      return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath(`/prestataires/${parsed.prestataire_id}`);
    return successResponse("Document ajouté avec succès", { id: created.id });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de l'ajout du document"
    ) as ActionResponse<{ id: string }>;
  }
}

// ── Delete ──────────────────────────────────────────────────────
export async function deletePrestataireDocument(
  id: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé");

    const supabase = createClient();

    // Fetch document to get prestataire_id for revalidation
    const { data: doc } = await supabase
      .from("prestataire_documents")
      .select("prestataire_id")
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (!doc) return errorResponse("Document non trouvé");

    const { error } = await supabase
      .from("prestataire_documents")
      .delete()
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath(`/prestataires/${doc.prestataire_id}`);
    return successResponse("Document supprimé avec succès");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la suppression du document"
    );
  }
}
