"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import type { Reservation, Logement, GuestPortalToken } from "@/types/database";

// ---------------------------------------------------------------------------
// Generate Portal Token
// ---------------------------------------------------------------------------

export async function generatePortalToken(
  reservationId: string
): Promise<ActionResponse<{ token: string; url: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) {
      return errorResponse("Non autorisé") as ActionResponse<{ token: string; url: string }>;
    }

    const supabase = createClient();

    // Verify the reservation belongs to the org
    const { data: reservation, error: resError } = await supabase
      .from("reservations")
      .select("id")
      .eq("id", reservationId)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (resError || !reservation) {
      return errorResponse("Réservation introuvable") as ActionResponse<{ token: string; url: string }>;
    }

    // Generate a cryptographically secure random token
    const token = (await import("crypto")).randomBytes(32).toString("hex");

    // Expire in 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Upsert: if a token already exists for this reservation, update it
    const { data: existing } = await supabase
      .from("guest_portal_tokens")
      .select("id")
      .eq("reservation_id", reservationId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("guest_portal_tokens")
        .update({
          token,
          expires_at: expiresAt.toISOString(),
        })
        .eq("id", existing.id);

      if (error) return errorResponse(error.message) as ActionResponse<{ token: string; url: string }>;
    } else {
      const { error } = await supabase
        .from("guest_portal_tokens")
        .insert({
          reservation_id: reservationId,
          token,
          expires_at: expiresAt.toISOString(),
        });

      if (error) return errorResponse(error.message) as ActionResponse<{ token: string; url: string }>;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${baseUrl}/guest/${token}`;

    revalidatePath(`/reservations/${reservationId}`);
    return successResponse("Lien portail généré avec succès", { token, url });
  } catch (err) {
    return errorResponse(
      (err as Error).message ?? "Erreur lors de la génération du lien portail"
    ) as ActionResponse<{ token: string; url: string }>;
  }
}

// ---------------------------------------------------------------------------
// Get Portal Token for a Reservation
// ---------------------------------------------------------------------------

export async function getPortalTokenForReservation(
  reservationId: string
): Promise<GuestPortalToken | null> {
  const profile = await requireProfile();
  const supabase = createClient();

  // Verify reservation belongs to user's org first
  const { data: reservation } = await supabase
    .from("reservations")
    .select("id")
    .eq("id", reservationId)
    .eq("organisation_id", profile.organisation_id)
    .maybeSingle();

  if (!reservation) return null;

  const { data } = await supabase
    .from("guest_portal_tokens")
    .select("*")
    .eq("reservation_id", reservationId)
    .maybeSingle();

  return data as GuestPortalToken | null;
}

// ---------------------------------------------------------------------------
// Get Portal Data (public, no auth needed)
// ---------------------------------------------------------------------------

export interface PortalData {
  reservation: {
    guest_name: string;
    check_in_date: string;
    check_out_date: string;
    check_in_time: string | null;
    check_out_time: string | null;
    access_instructions: string | null;
  };
  logement: {
    name: string;
    address_line1: string | null;
    city: string | null;
    postal_code: string | null;
    lockbox_code: string | null;
    wifi_name: string | null;
    wifi_password: string | null;
  } | null;
}

export async function getPortalData(
  token: string
): Promise<{ valid: boolean; expired?: boolean; data?: PortalData }> {
  // Use service-level access since this is a public page with no auth
  const supabase = createClient();

  // Fetch the token
  const { data: portalToken, error: tokenError } = await supabase
    .from("guest_portal_tokens")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (tokenError || !portalToken) {
    return { valid: false };
  }

  // Check expiry
  if (new Date(portalToken.expires_at) < new Date()) {
    return { valid: false, expired: true };
  }

  // Fetch reservation with logement
  const { data: reservation, error: resError } = await supabase
    .from("reservations")
    .select("guest_name, check_in_date, check_out_date, check_in_time, check_out_time, access_instructions, logement:logements(name, address_line1, city, postal_code, lockbox_code, wifi_name, wifi_password)")
    .eq("id", portalToken.reservation_id)
    .single();

  if (resError || !reservation) {
    return { valid: false };
  }

  const logement = reservation.logement as unknown as PortalData["logement"];

  return {
    valid: true,
    data: {
      reservation: {
        guest_name: reservation.guest_name,
        check_in_date: reservation.check_in_date,
        check_out_date: reservation.check_out_date,
        check_in_time: reservation.check_in_time,
        check_out_time: reservation.check_out_time,
        access_instructions: reservation.access_instructions,
      },
      logement,
    },
  };
}
