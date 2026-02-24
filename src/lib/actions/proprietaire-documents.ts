"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdminOrManager } from "@/lib/auth";
import {
  proprietaireDocumentSchema,
  type ProprietaireDocumentFormData,
} from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import {
  type ActionResponse,
  successResponse,
  errorResponse,
} from "@/lib/action-response";
import type { ProprietaireDocument } from "@/types/database";

// ── List ────────────────────────────────────────────────────────
export async function getProprietaireDocuments(
  proprietaireId: string
): Promise<ProprietaireDocument[]> {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("proprietaire_documents")
    .select("*")
    .eq("proprietaire_id", proprietaireId)
    .eq("organisation_id", profile.organisation_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getProprietaireDocuments error:", error);
    return [];
  }
  return (data ?? []) as ProprietaireDocument[];
}

// ── Create ──────────────────────────────────────────────────────
export async function createProprietaireDocument(
  data: ProprietaireDocumentFormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile))
      return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = proprietaireDocumentSchema.parse(data);
    const supabase = createClient();

    // Verify proprietaire belongs to this org
    const { data: proprietaire } = await supabase
      .from("proprietaires")
      .select("id")
      .eq("id", parsed.proprietaire_id)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (!proprietaire)
      return errorResponse("Propriétaire non trouvé") as ActionResponse<{
        id: string;
      }>;

    const { data: created, error } = await supabase
      .from("proprietaire_documents")
      .insert({
        proprietaire_id: parsed.proprietaire_id,
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

    revalidatePath(`/proprietaires/${parsed.proprietaire_id}`);
    return successResponse("Document ajouté avec succès", { id: created.id });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de l'ajout du document"
    ) as ActionResponse<{ id: string }>;
  }
}

// ── Delete ──────────────────────────────────────────────────────
export async function deleteProprietaireDocument(
  id: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) return errorResponse("Non autorisé");

    const supabase = createClient();

    // Fetch document to get proprietaire_id for revalidation
    const { data: doc } = await supabase
      .from("proprietaire_documents")
      .select("proprietaire_id")
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (!doc) return errorResponse("Document non trouvé");

    const { error } = await supabase
      .from("proprietaire_documents")
      .delete()
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath(`/proprietaires/${doc.proprietaire_id}`);
    return successResponse("Document supprimé avec succès");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la suppression du document"
    );
  }
}
