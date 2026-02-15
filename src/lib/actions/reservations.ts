"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { reservationSchema, type ReservationFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createReservation(data: ReservationFormData) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) throw new Error("Non autorisé");

  const parsed = reservationSchema.parse(data);
  const supabase = createClient();

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
      check_out_date: parsed.check_out_date,
      platform: parsed.platform,
      amount: parsed.amount,
      status: parsed.status,
      notes: parsed.notes || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Auto-create missions if status is CONFIRMEE
  if (reservation && parsed.status === "CONFIRMEE") {
    await createMissionsForReservation(
      reservation.id,
      reservation.logement_id,
      parsed.check_in_date,
      parsed.check_out_date,
      profile.organisation_id
    );
  }

  revalidatePath("/reservations");
  redirect("/reservations");
}

export async function updateReservation(id: string, data: ReservationFormData) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) throw new Error("Non autorisé");

  const parsed = reservationSchema.parse(data);
  const supabase = createClient();

  // Get current reservation to check status change
  const { data: currentReservation } = await supabase
    .from("reservations")
    .select("status")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("reservations")
    .update({
      logement_id: parsed.logement_id,
      guest_name: parsed.guest_name,
      guest_email: parsed.guest_email || null,
      guest_phone: parsed.guest_phone || null,
      guest_count: parsed.guest_count,
      check_in_date: parsed.check_in_date,
      check_out_date: parsed.check_out_date,
      platform: parsed.platform,
      amount: parsed.amount,
      status: parsed.status,
      notes: parsed.notes || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // If status changed to CONFIRMEE, create missions
  if (currentReservation?.status !== "CONFIRMEE" && parsed.status === "CONFIRMEE") {
    await createMissionsForReservation(
      id,
      parsed.logement_id,
      parsed.check_in_date,
      parsed.check_out_date,
      profile.organisation_id
    );
  }

  revalidatePath("/reservations");
  redirect(`/reservations/${id}`);
}

export async function deleteReservation(id: string) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) throw new Error("Non autorisé");

  const supabase = createClient();
  const { error } = await supabase.from("reservations").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/reservations");
  redirect("/reservations");
}

// Helper function to auto-create missions
async function createMissionsForReservation(
  reservationId: string,
  logementId: string,
  checkInDate: string,
  checkOutDate: string,
  organisationId: string
) {
  const supabase = createClient();

  // Check if missions already exist for this reservation
  const { data: existingMissions } = await supabase
    .from("missions")
    .select("id")
    .eq("logement_id", logementId)
    .gte("scheduled_at", checkInDate)
    .lte("scheduled_at", checkOutDate);

  // Don't create missions if they already exist
  if (existingMissions && existingMissions.length > 0) {
    return;
  }

  const checkInDateTime = `${checkInDate}T15:00:00`;
  const checkOutDateTime = `${checkOutDate}T11:00:00`;
  const menageDateTime = `${checkOutDate}T13:00:00`; // 2h after checkout

  const missions = [
    {
      organisation_id: organisationId,
      logement_id: logementId,
      type: "CHECKIN",
      status: "A_FAIRE",
      priority: "NORMALE",
      scheduled_at: checkInDateTime,
      notes: `Check-in pour réservation ${reservationId}`,
    },
    {
      organisation_id: organisationId,
      logement_id: logementId,
      type: "CHECKOUT",
      status: "A_FAIRE",
      priority: "NORMALE",
      scheduled_at: checkOutDateTime,
      notes: `Check-out pour réservation ${reservationId}`,
    },
    {
      organisation_id: organisationId,
      logement_id: logementId,
      type: "MENAGE",
      status: "A_FAIRE",
      priority: "HAUTE",
      scheduled_at: menageDateTime,
      notes: `Ménage post-réservation ${reservationId}`,
    },
  ];

  await supabase.from("missions").insert(missions);
}
