"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { messageTemplateSchema, sendGuestMessageSchema, type MessageTemplateFormData, type SendGuestMessageFormData } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";
import type { MessageTemplate, GuestMessage } from "@/types/database";

// ---------------------------------------------------------------------------
// Message Templates CRUD
// ---------------------------------------------------------------------------

export async function getMessageTemplates(organisationId?: string): Promise<MessageTemplate[]> {
  const profile = await requireProfile();
  const supabase = createClient();
  const orgId = organisationId ?? profile.organisation_id;

  const { data, error } = await supabase
    .from("message_templates")
    .select("*")
    .eq("organisation_id", orgId)
    .order("type")
    .order("name");

  if (error) {
    console.error("getMessageTemplates error:", error);
    return [];
  }

  return (data ?? []) as MessageTemplate[];
}

export async function createMessageTemplate(
  data: MessageTemplateFormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = messageTemplateSchema.parse(data);
    const supabase = createClient();

    const { data: template, error } = await supabase
      .from("message_templates")
      .insert({
        organisation_id: profile.organisation_id,
        name: parsed.name,
        subject: parsed.subject || "",
        body: parsed.body,
        type: parsed.type,
        channel: parsed.channel,
        active: parsed.active,
        trigger_event: parsed.trigger_event || null,
      })
      .select()
      .single();

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/settings");
    revalidatePath("/reservations");
    return successResponse("Template créé avec succès", { id: template.id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la création du template") as ActionResponse<{ id: string }>;
  }
}

export async function updateMessageTemplate(
  id: string,
  data: MessageTemplateFormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = messageTemplateSchema.parse(data);
    const supabase = createClient();

    const { error } = await supabase
      .from("message_templates")
      .update({
        name: parsed.name,
        subject: parsed.subject || "",
        body: parsed.body,
        type: parsed.type,
        channel: parsed.channel,
        active: parsed.active,
        trigger_event: parsed.trigger_event || null,
      })
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message) as ActionResponse<{ id: string }>;

    revalidatePath("/settings");
    revalidatePath("/reservations");
    return successResponse("Template mis à jour avec succès", { id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la mise à jour du template") as ActionResponse<{ id: string }>;
  }
}

export async function deleteMessageTemplate(id: string): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé");

    const supabase = createClient();
    const { error } = await supabase
      .from("message_templates")
      .delete()
      .eq("id", id)
      .eq("organisation_id", profile.organisation_id);

    if (error) return errorResponse(error.message);

    revalidatePath("/settings");
    revalidatePath("/reservations");
    return successResponse("Template supprimé avec succès");
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de la suppression du template");
  }
}

// ---------------------------------------------------------------------------
// Send Guest Message
// ---------------------------------------------------------------------------

export async function sendGuestMessage(
  data: SendGuestMessageFormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    if (!isAdmin(profile)) return errorResponse("Non autorisé") as ActionResponse<{ id: string }>;

    const parsed = sendGuestMessageSchema.parse(data);
    const supabase = createClient();

    // Fetch the reservation to get recipient info
    const { data: reservation, error: resError } = await supabase
      .from("reservations")
      .select("id, guest_name, guest_email, guest_phone")
      .eq("id", parsed.reservation_id)
      .eq("organisation_id", profile.organisation_id)
      .single();

    if (resError || !reservation) {
      return errorResponse("Réservation introuvable") as ActionResponse<{ id: string }>;
    }

    // Determine recipient based on channel
    const recipient = parsed.channel === "EMAIL"
      ? reservation.guest_email
      : reservation.guest_phone;

    if (!recipient) {
      return errorResponse(
        parsed.channel === "EMAIL"
          ? "Aucune adresse email pour ce voyageur"
          : "Aucun numéro de téléphone pour ce voyageur"
      ) as ActionResponse<{ id: string }>;
    }

    // Create the message record with status PENDING
    const { data: message, error: msgError } = await supabase
      .from("guest_messages")
      .insert({
        organisation_id: profile.organisation_id,
        reservation_id: parsed.reservation_id,
        template_id: parsed.template_id || null,
        channel: parsed.channel,
        recipient,
        subject: parsed.subject || null,
        body: parsed.body,
        status: "PENDING",
      })
      .select()
      .single();

    if (msgError) return errorResponse(msgError.message) as ActionResponse<{ id: string }>;

    // Simulate sending: log and mark as SENT
    console.log(`[GuestMessage] Sending ${parsed.channel} to ${recipient}: ${parsed.subject ?? "(no subject)"}`);

    const { error: updateError } = await supabase
      .from("guest_messages")
      .update({ status: "SENT", sent_at: new Date().toISOString() })
      .eq("id", message.id);

    if (updateError) {
      console.error("Failed to update message status:", updateError);
    }

    revalidatePath(`/reservations/${parsed.reservation_id}`);
    return successResponse("Message envoyé avec succès", { id: message.id });
  } catch (err) {
    return errorResponse((err as Error).message ?? "Erreur lors de l'envoi du message") as ActionResponse<{ id: string }>;
  }
}

// ---------------------------------------------------------------------------
// Get Messages for Reservation
// ---------------------------------------------------------------------------

export async function getMessagesForReservation(reservationId: string): Promise<GuestMessage[]> {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("guest_messages")
    .select("*")
    .eq("reservation_id", reservationId)
    .eq("organisation_id", profile.organisation_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getMessagesForReservation error:", error);
    return [];
  }

  return (data ?? []) as GuestMessage[];
}

// ---------------------------------------------------------------------------
// Template Variable Replacement Helper
// ---------------------------------------------------------------------------

export async function replaceTemplateVariables(
  text: string,
  reservationId: string
): Promise<string> {
  const profile = await requireProfile();
  const supabase = createClient();

  // Fetch reservation with logement and owner (proprietaire) joins
  const { data: reservation } = await supabase
    .from("reservations")
    .select("*, logement:logements(*, proprietaire:proprietaires(*))")
    .eq("id", reservationId)
    .eq("organisation_id", profile.organisation_id)
    .single();

  if (!reservation) return text;

  const logement = reservation.logement as {
    name: string;
    address_line1: string | null;
    city: string | null;
    postal_code: string | null;
    lockbox_code: string | null;
    wifi_name: string | null;
    wifi_password: string | null;
    proprietaire?: {
      full_name: string;
      email: string | null;
    } | null;
  } | null;

  // Fetch organisation details for org_* variables
  const { data: organisation } = await supabase
    .from("organisations")
    .select("name, phone, email")
    .eq("id", profile.organisation_id)
    .single();

  // Build logement address string
  const addressParts = [
    logement?.address_line1,
    logement?.postal_code,
    logement?.city,
  ].filter(Boolean);
  const logementAddress = addressParts.join(", ");

  // Format amount
  const formattedAmount = reservation.amount != null
    ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(reservation.amount)
    : "";

  const replacements: Record<string, string> = {
    // Voyageur
    "{{guest_name}}": reservation.guest_name ?? "",
    "{{guest_email}}": reservation.guest_email ?? "",
    "{{guest_phone}}": reservation.guest_phone ?? "",
    // Réservation
    "{{check_in_date}}": reservation.check_in_date
      ? new Date(reservation.check_in_date).toLocaleDateString("fr-FR")
      : "",
    "{{check_out_date}}": reservation.check_out_date
      ? new Date(reservation.check_out_date).toLocaleDateString("fr-FR")
      : "",
    "{{check_in_time}}": reservation.check_in_time ?? "",
    "{{check_out_time}}": reservation.check_out_time ?? "",
    "{{amount}}": formattedAmount,
    "{{platform}}": reservation.platform ?? "",
    // Logement
    "{{logement_name}}": logement?.name ?? "",
    "{{logement_address}}": logementAddress,
    "{{lockbox_code}}": logement?.lockbox_code ?? "",
    "{{wifi_name}}": logement?.wifi_name ?? "",
    "{{wifi_password}}": logement?.wifi_password ?? "",
    // Organisation
    "{{org_name}}": organisation?.name ?? "",
    "{{org_phone}}": organisation?.phone ?? "",
    "{{org_email}}": organisation?.email ?? "",
    // Propriétaire
    "{{owner_name}}": logement?.proprietaire?.full_name ?? "",
    "{{owner_email}}": logement?.proprietaire?.email ?? "",
    // Opérateur (current user acting as operator)
    "{{operator_name}}": profile.full_name ?? "",
  };

  let result = text;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replaceAll(key, value);
  }

  return result;
}
