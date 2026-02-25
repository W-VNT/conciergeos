"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import { ownerPaymentSchema, type OwnerPaymentFormData } from "@/lib/schemas";
import type { OwnerPayment } from "@/types/database";

// ---------------------------------------------------------------------------
// Get Owner Payments (with optional filters)
// ---------------------------------------------------------------------------

export async function getOwnerPayments(filters?: {
  status?: string;
  proprietaire_search?: string;
}): Promise<OwnerPayment[]> {
  const profile = await requireProfile();
  const supabase = createClient();

  let query = supabase
    .from("owner_payments")
    .select("*, proprietaire:proprietaires(id, full_name), contrat:contrats(id, type, start_date, end_date)")
    .eq("organisation_id", profile.organisation_id)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) return [];

  let results = (data ?? []) as unknown as OwnerPayment[];

  // Client-side filter for proprietaire name (joined field)
  if (filters?.proprietaire_search) {
    const search = filters.proprietaire_search.toLowerCase();
    results = results.filter((p) =>
      p.proprietaire?.full_name?.toLowerCase().includes(search)
    );
  }

  return results;
}

// ---------------------------------------------------------------------------
// Get Owner Payments for a specific Proprietaire
// ---------------------------------------------------------------------------

export async function getOwnerPaymentsForProprietaire(
  proprietaireId: string
): Promise<OwnerPayment[]> {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("owner_payments")
    .select("*, proprietaire:proprietaires(id, full_name), contrat:contrats(id, type, start_date, end_date)")
    .eq("proprietaire_id", proprietaireId)
    .eq("organisation_id", profile.organisation_id)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as unknown as OwnerPayment[];
}

// ---------------------------------------------------------------------------
// Create Owner Payment
// ---------------------------------------------------------------------------

export async function createOwnerPayment(
  data: OwnerPaymentFormData & { organisation_id?: string }
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) {
      return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;
    }

    const parsed = ownerPaymentSchema.parse(data);
    const supabase = createClient();

    const { data: created, error } = await supabase
      .from("owner_payments")
      .insert({
        organisation_id: profile.organisation_id,
        proprietaire_id: parsed.proprietaire_id,
        contrat_id: parsed.contrat_id || null,
        amount: parsed.amount,
        period_start: parsed.period_start || null,
        period_end: parsed.period_end || null,
        status: "DU",
        paid_amount: 0,
        notes: parsed.notes || null,
      })
      .select("id")
      .single();

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/paiements-proprietaires");
    revalidatePath(`/proprietaires/${parsed.proprietaire_id}`);
    return successResponse("Paiement créé avec succès", { id: created.id });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la création du paiement"
    ) as ActionResponse<{ id: string }>;
  }
}

// ---------------------------------------------------------------------------
// Mark Owner Payment as Paid
// ---------------------------------------------------------------------------

export async function markOwnerPaymentPaid(
  paymentId: string,
  paidAmount: number,
  paidAt?: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) {
      return errorResponse("Non autorisé");
    }

    const supabase = createClient();

    const { data: payment, error: fetchError } = await supabase
      .from("owner_payments")
      .select("proprietaire_id, status, amount")
      .eq("id", paymentId)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (fetchError || !payment) {
      return errorResponse("Paiement introuvable");
    }

    const { error } = await supabase
      .from("owner_payments")
      .update({
        status: "PAYE",
        paid_amount: paidAmount,
        paid_at: paidAt || new Date().toISOString().split("T")[0],
      })
      .eq("id", paymentId)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath("/paiements-proprietaires");
    revalidatePath(`/proprietaires/${payment.proprietaire_id}`);
    return successResponse("Paiement marqué comme payé");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la mise à jour"
    );
  }
}

// ---------------------------------------------------------------------------
// Mark Owner Payment as Partial
// ---------------------------------------------------------------------------

export async function markOwnerPaymentPartial(
  paymentId: string,
  paidAmount: number
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) {
      return errorResponse("Non autorisé");
    }

    const supabase = createClient();

    const { data: payment, error: fetchError } = await supabase
      .from("owner_payments")
      .select("proprietaire_id, status, amount")
      .eq("id", paymentId)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (fetchError || !payment) {
      return errorResponse("Paiement introuvable");
    }

    if (paidAmount >= payment.amount) {
      return errorResponse("Le montant partiel doit être inférieur au montant total");
    }

    const { error } = await supabase
      .from("owner_payments")
      .update({
        status: "PARTIEL",
        paid_amount: paidAmount,
        paid_at: new Date().toISOString().split("T")[0],
      })
      .eq("id", paymentId)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath("/paiements-proprietaires");
    revalidatePath(`/proprietaires/${payment.proprietaire_id}`);
    return successResponse("Paiement marqué comme partiel");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la mise à jour"
    );
  }
}

// ---------------------------------------------------------------------------
// Delete Owner Payment
// ---------------------------------------------------------------------------

export async function deleteOwnerPayment(
  paymentId: string
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdminOrManager(profile)) {
      return errorResponse("Non autorisé");
    }

    const supabase = createClient();

    const { data: payment, error: fetchError } = await supabase
      .from("owner_payments")
      .select("proprietaire_id")
      .eq("id", paymentId)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (fetchError || !payment) {
      return errorResponse("Paiement introuvable");
    }

    const { error } = await supabase
      .from("owner_payments")
      .delete()
      .eq("id", paymentId)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath("/paiements-proprietaires");
    revalidatePath(`/proprietaires/${payment.proprietaire_id}`);
    return successResponse("Paiement supprimé");
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la suppression"
    );
  }
}
