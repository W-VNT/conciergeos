"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { reservationSchema, type ReservationFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import { findLogementTemplate } from "@/lib/actions/checklists";

async function checkOverlap(
  supabase: ReturnType<typeof createClient>,
  logementId: string,
  checkInDate: string,
  checkOutDate: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from("reservations")
    .select("id")
    .eq("logement_id", logementId)
    .neq("status", "ANNULEE")
    .lt("check_in_date", checkOutDate)
    .gt("check_out_date", checkInDate);

  if (excludeId) query = query.neq("id", excludeId);

  const { data } = await query;
  return (data ?? []).length > 0;
}

export async function createReservation(data: ReservationFormData): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = reservationSchema.parse(data);
    const supabase = createClient();

    const hasOverlap = await checkOverlap(
      supabase,
      parsed.logement_id,
      parsed.check_in_date,
      parsed.check_out_date
    );
    if (hasOverlap) return errorResponse("Ce logement est déjà réservé sur cette période.") as ActionResponse<{ id: string }>;

    const { data: reservation, error } = await supabase
      .from("reservations")
      .insert({
        organisation_id: profile.organisation_id,
        logement_id: parsed.logement_id,
        guest_name: parsed.guest_name,
        guest_email: parsed.guest_email || null,
        guest_phone: parsed.guest_phone || null,
        guest_count: parsed.guest_count,
        check_in_date: parsed.check_in_date,
        check_in_time: parsed.check_in_time || null,
        check_out_date: parsed.check_out_date,
        check_out_time: parsed.check_out_time || null,
        platform: parsed.platform,
        amount: parsed.amount,
        status: parsed.status,
        notes: parsed.notes || null,
        access_instructions: parsed.access_instructions || null,
      })
      .select()
      .single();

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    if (reservation && parsed.status === "CONFIRMEE") {
      await createMissionsForReservation(
        reservation.id,
        reservation.logement_id,
        parsed.check_in_date,
        parsed.check_out_date,
        profile.organisation_id
      );
      // TODO: Uncomment when Finance section is implemented
      // await createRevenuForReservation(
      //   reservation.id,
      //   reservation.logement_id,
      //   parsed.check_in_date,
      //   parsed.check_out_date,
      //   parsed.amount,
      //   profile.organisation_id
      // );
    }

    revalidatePath("/reservations");
    return successResponse("Réservation créée avec succès", { id: reservation.id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la création de la réservation") as ActionResponse<{ id: string }>;
  }
}

export async function updateReservation(id: string, data: ReservationFormData): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = reservationSchema.parse(data);
    const supabase = createClient();

    const { data: currentReservation } = await supabase
      .from("reservations")
      .select("status")
      .eq("id", id)
      .single();

    if (parsed.status !== "ANNULEE") {
      const hasOverlap = await checkOverlap(
        supabase,
        parsed.logement_id,
        parsed.check_in_date,
        parsed.check_out_date,
        id
      );
      if (hasOverlap) return errorResponse("Ce logement est déjà réservé sur cette période.") as ActionResponse<{ id: string }>;
    }

    const { error } = await supabase
      .from("reservations")
      .update({
        logement_id: parsed.logement_id,
        guest_name: parsed.guest_name,
        guest_email: parsed.guest_email || null,
        guest_phone: parsed.guest_phone || null,
        guest_count: parsed.guest_count,
        check_in_date: parsed.check_in_date,
        check_in_time: parsed.check_in_time || null,
        check_out_date: parsed.check_out_date,
        check_out_time: parsed.check_out_time || null,
        platform: parsed.platform,
        amount: parsed.amount,
        status: parsed.status,
        notes: parsed.notes || null,
        access_instructions: parsed.access_instructions || null,
      })
      .eq("id", id);

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    // Status changed to CONFIRMEE → create missions + revenu
    if (currentReservation?.status !== "CONFIRMEE" && parsed.status === "CONFIRMEE") {
      await createMissionsForReservation(
        id,
        parsed.logement_id,
        parsed.check_in_date,
        parsed.check_out_date,
        profile.organisation_id
      );
      // TODO: Uncomment when Finance section is implemented
      // await createRevenuForReservation(
      //   id,
      //   parsed.logement_id,
      //   parsed.check_in_date,
      //   parsed.check_out_date,
      //   parsed.amount,
      //   profile.organisation_id
      // );
    }

    // Status changed to ANNULEE → cancel missions
    if (currentReservation?.status !== "ANNULEE" && parsed.status === "ANNULEE") {
      await cancelMissionsForReservation(id);
    }

    revalidatePath("/reservations");
    revalidatePath(`/reservations/${id}`);
    return successResponse("Réservation mise à jour avec succès", { id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la mise à jour de la réservation") as ActionResponse<{ id: string }>;
  }
}

export async function terminateReservation(id: string) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) throw new Error("Non autorisé");

  const supabase = createClient();
  const { error } = await supabase
    .from("reservations")
    .update({ status: "TERMINEE" })
    .eq("id", id)
    .eq("status", "CONFIRMEE");

  if (error) throw new Error(error.message);

  revalidatePath(`/reservations/${id}`);
  revalidatePath("/reservations");
}

export async function deleteReservation(id: string): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé");

    const supabase = createClient();
    await cancelMissionsForReservation(id);
    const { error } = await supabase.from("reservations").delete().eq("id", id);
    if (error) return errorResponse(error.message);

    revalidatePath("/reservations");
    return successResponse("Réservation supprimée avec succès");
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la suppression de la réservation");
  }
}

// ---------------------------------------------------------------------------

async function createMissionsForReservation(
  reservationId: string,
  logementId: string,
  checkInDate: string,
  checkOutDate: string,
  organisationId: string
) {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("missions")
    .select("id")
    .eq("reservation_id", reservationId);

  if (existing && existing.length > 0) return;

  const missions = [
    {
      organisation_id: organisationId,
      logement_id: logementId,
      reservation_id: reservationId,
      type: "CHECKIN",
      status: "A_FAIRE",
      priority: "NORMALE",
      scheduled_at: `${checkInDate}T15:00:00`,
      notes: `Check-in réservation`,
    },
    {
      organisation_id: organisationId,
      logement_id: logementId,
      reservation_id: reservationId,
      type: "CHECKOUT",
      status: "A_FAIRE",
      priority: "NORMALE",
      scheduled_at: `${checkOutDate}T11:00:00`,
      notes: `Check-out réservation`,
    },
    {
      organisation_id: organisationId,
      logement_id: logementId,
      reservation_id: reservationId,
      type: "MENAGE",
      status: "A_FAIRE",
      priority: "HAUTE",
      scheduled_at: `${checkOutDate}T13:00:00`,
      notes: `Ménage post-réservation`,
    },
  ];

  const { data: created } = await supabase
    .from("missions")
    .insert(missions)
    .select("id, type");

  // Auto-assign checklist templates per logement + mission type
  if (created && created.length > 0) {
    const checklistInserts: { mission_id: string; item_id: string; completed: boolean }[] = [];

    for (const mission of created) {
      const templateId = await findLogementTemplate(supabase, logementId, mission.type);
      if (!templateId) continue;

      const { data: items } = await supabase
        .from("checklist_template_items")
        .select("id")
        .eq("template_id", templateId)
        .order("ordre");

      if (items && items.length > 0) {
        checklistInserts.push(
          ...items.map((item) => ({
            mission_id: mission.id,
            item_id: item.id,
            completed: false,
          }))
        );
      }
    }

    if (checklistInserts.length > 0) {
      await supabase.from("mission_checklist_items").insert(checklistInserts);
    }
  }
}

async function cancelMissionsForReservation(reservationId: string) {
  const supabase = createClient();
  await supabase
    .from("missions")
    .update({ status: "ANNULE" })
    .eq("reservation_id", reservationId)
    .in("status", ["A_FAIRE", "EN_COURS"]);
}

async function createRevenuForReservation(
  reservationId: string,
  logementId: string,
  checkInDate: string,
  checkOutDate: string,
  montantBrut: number | null,
  organisationId: string
) {
  if (!montantBrut) return;

  const supabase = createClient();

  // Don't create if already exists
  const { data: existing } = await supabase
    .from("revenus")
    .select("id")
    .eq("reservation_id", reservationId)
    .maybeSingle();

  if (existing) return;

  // Find active contrat for this logement at check-in date
  const { data: contrat } = await supabase
    .from("contrats")
    .select("id, commission_rate")
    .eq("logement_id", logementId)
    .eq("status", "ACTIF")
    .lte("start_date", checkInDate)
    .gte("end_date", checkInDate)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const tauxCommission = contrat?.commission_rate ?? 0;
  const montantCommission = Math.round(montantBrut * tauxCommission) / 100;
  const montantNet = montantBrut - montantCommission;

  await supabase.from("revenus").insert({
    organisation_id: organisationId,
    reservation_id: reservationId,
    logement_id: logementId,
    contrat_id: contrat?.id ?? null,
    montant_brut: montantBrut,
    taux_commission: tauxCommission,
    montant_commission: montantCommission,
    montant_net: montantNet,
    date_reservation: new Date().toISOString().split("T")[0],
    date_checkin: checkInDate,
    date_checkout: checkOutDate,
  });
}
