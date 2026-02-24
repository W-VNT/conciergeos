import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Auto Emails Cron (R18)
 *
 * Runs periodically to send automatic messages:
 * 1. CONFIRMATION: when reservation status = CONFIRMEE and no confirmation message sent yet
 * 2. RAPPEL: 48h before check-in, if no reminder sent
 * 3. REMERCIEMENT: 24h after check-out, if no thank-you sent
 *
 * For each, finds the org's template of that type (or uses default text),
 * replaces variables, and creates a guest_message record.
 */

interface TemplateVars {
  guest_name: string;
  logement_name: string;
  check_in_date: string;
  check_out_date: string;
  lockbox_code: string;
  wifi_name: string;
  wifi_password: string;
}

function replaceVars(text: string, vars: TemplateVars): string {
  let result = text;
  result = result.replaceAll("{{guest_name}}", vars.guest_name);
  result = result.replaceAll("{{logement_name}}", vars.logement_name);
  result = result.replaceAll("{{check_in_date}}", vars.check_in_date);
  result = result.replaceAll("{{check_out_date}}", vars.check_out_date);
  result = result.replaceAll("{{lockbox_code}}", vars.lockbox_code);
  result = result.replaceAll("{{wifi_name}}", vars.wifi_name);
  result = result.replaceAll("{{wifi_password}}", vars.wifi_password);
  return result;
}

const DEFAULT_TEMPLATES = {
  CONFIRMATION: {
    subject: "Confirmation de votre réservation",
    body: `Bonjour {{guest_name}},

Nous avons le plaisir de vous confirmer votre réservation au {{logement_name}}.

Dates du séjour :
- Arrivée : {{check_in_date}}
- Départ : {{check_out_date}}

Nous vous enverrons les informations d'accès quelques heures avant votre arrivée.

À bientôt !`,
  },
  RAPPEL: {
    subject: "Rappel : votre séjour approche !",
    body: `Bonjour {{guest_name}},

Votre séjour au {{logement_name}} approche !

Pour rappel :
- Arrivée : {{check_in_date}}
- Départ : {{check_out_date}}

Nous vous enverrons les informations d'accès (code, WiFi, etc.) très prochainement.

À très bientôt !`,
  },
  REMERCIEMENT: {
    subject: "Merci pour votre séjour !",
    body: `Bonjour {{guest_name}},

Nous espérons que votre séjour au {{logement_name}} s'est bien passé.

Merci de nous avoir fait confiance. N'hésitez pas à nous laisser un avis, cela nous aide beaucoup !

À bientôt pour un prochain séjour.`,
  },
};

export async function GET(request: NextRequest) {
  // Authenticate via CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const now = new Date();
  const results = {
    confirmation: { processed: 0, skipped: 0 },
    rappel: { processed: 0, skipped: 0 },
    remerciement: { processed: 0, skipped: 0 },
  };

  // -----------------------------------------------------------------------
  // 1. CONFIRMATION: Confirmed reservations without a confirmation message
  // -----------------------------------------------------------------------
  const { data: confirmedReservations } = await supabase
    .from("reservations")
    .select("id, organisation_id, guest_name, guest_email, guest_phone, check_in_date, check_out_date, logement:logements(name, lockbox_code, wifi_name, wifi_password)")
    .eq("status", "CONFIRMEE")
    .gte("check_in_date", now.toISOString().split("T")[0]);

  if (confirmedReservations) {
    for (const res of confirmedReservations) {
      const sent = await hasMessageOfType(supabase, res.id, res.organisation_id, "CONFIRMATION");
      if (sent) {
        results.confirmation.skipped++;
        continue;
      }

      const recipient = res.guest_email || res.guest_phone;
      if (!recipient) {
        results.confirmation.skipped++;
        continue;
      }

      const logement = res.logement as unknown as { name: string; lockbox_code: string | null; wifi_name: string | null; wifi_password: string | null } | null;
      const vars = buildVars(res, logement);
      const template = await getOrgTemplate(supabase, res.organisation_id, "CONFIRMATION");

      const subject = replaceVars(template.subject, vars);
      const body = replaceVars(template.body, vars);
      const channel = res.guest_email ? "EMAIL" : "SMS";

      const { error } = await supabase.from("guest_messages").insert({
        organisation_id: res.organisation_id,
        reservation_id: res.id,
        template_id: template.id || null,
        channel,
        recipient,
        subject,
        body,
        status: "SENT",
        sent_at: new Date().toISOString(),
      });

      if (error) {
        console.error(`auto-emails: CONFIRMATION failed for ${res.id}:`, error);
        continue;
      }

      console.log(`[auto-emails] CONFIRMATION sent to ${recipient} for reservation ${res.id}`);
      results.confirmation.processed++;
    }
  }

  // -----------------------------------------------------------------------
  // 2. RAPPEL: 48h before check-in, if no reminder sent
  // -----------------------------------------------------------------------
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const in48hDateStr = in48h.toISOString().split("T")[0];
  const nowDateStr = now.toISOString().split("T")[0];

  const { data: rappelReservations } = await supabase
    .from("reservations")
    .select("id, organisation_id, guest_name, guest_email, guest_phone, check_in_date, check_out_date, logement:logements(name, lockbox_code, wifi_name, wifi_password)")
    .eq("status", "CONFIRMEE")
    .gte("check_in_date", nowDateStr)
    .lte("check_in_date", in48hDateStr);

  if (rappelReservations) {
    for (const res of rappelReservations) {
      const sent = await hasMessageOfType(supabase, res.id, res.organisation_id, "RAPPEL");
      if (sent) {
        results.rappel.skipped++;
        continue;
      }

      const recipient = res.guest_email || res.guest_phone;
      if (!recipient) {
        results.rappel.skipped++;
        continue;
      }

      const logement = res.logement as unknown as { name: string; lockbox_code: string | null; wifi_name: string | null; wifi_password: string | null } | null;
      const vars = buildVars(res, logement);
      const template = await getOrgTemplate(supabase, res.organisation_id, "RAPPEL");

      const subject = replaceVars(template.subject, vars);
      const body = replaceVars(template.body, vars);
      const channel = res.guest_email ? "EMAIL" : "SMS";

      const { error } = await supabase.from("guest_messages").insert({
        organisation_id: res.organisation_id,
        reservation_id: res.id,
        template_id: template.id || null,
        channel,
        recipient,
        subject,
        body,
        status: "SENT",
        sent_at: new Date().toISOString(),
      });

      if (error) {
        console.error(`auto-emails: RAPPEL failed for ${res.id}:`, error);
        continue;
      }

      console.log(`[auto-emails] RAPPEL sent to ${recipient} for reservation ${res.id}`);
      results.rappel.processed++;
    }
  }

  // -----------------------------------------------------------------------
  // 3. REMERCIEMENT: 24h after check-out, if no thank-you sent
  // -----------------------------------------------------------------------
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayDateStr = yesterday.toISOString().split("T")[0];
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const twoDaysAgoDateStr = twoDaysAgo.toISOString().split("T")[0];

  // Find reservations that checked out 24h-48h ago (to avoid sending too late)
  const { data: merciReservations } = await supabase
    .from("reservations")
    .select("id, organisation_id, guest_name, guest_email, guest_phone, check_in_date, check_out_date, logement:logements(name, lockbox_code, wifi_name, wifi_password)")
    .in("status", ["CONFIRMEE", "TERMINEE"])
    .gte("check_out_date", twoDaysAgoDateStr)
    .lte("check_out_date", yesterdayDateStr);

  if (merciReservations) {
    for (const res of merciReservations) {
      const sent = await hasMessageOfType(supabase, res.id, res.organisation_id, "REMERCIEMENT");
      if (sent) {
        results.remerciement.skipped++;
        continue;
      }

      const recipient = res.guest_email || res.guest_phone;
      if (!recipient) {
        results.remerciement.skipped++;
        continue;
      }

      const logement = res.logement as unknown as { name: string; lockbox_code: string | null; wifi_name: string | null; wifi_password: string | null } | null;
      const vars = buildVars(res, logement);
      const template = await getOrgTemplate(supabase, res.organisation_id, "REMERCIEMENT");

      const subject = replaceVars(template.subject, vars);
      const body = replaceVars(template.body, vars);
      const channel = res.guest_email ? "EMAIL" : "SMS";

      const { error } = await supabase.from("guest_messages").insert({
        organisation_id: res.organisation_id,
        reservation_id: res.id,
        template_id: template.id || null,
        channel,
        recipient,
        subject,
        body,
        status: "SENT",
        sent_at: new Date().toISOString(),
      });

      if (error) {
        console.error(`auto-emails: REMERCIEMENT failed for ${res.id}:`, error);
        continue;
      }

      console.log(`[auto-emails] REMERCIEMENT sent to ${recipient} for reservation ${res.id}`);
      results.remerciement.processed++;
    }
  }

  return NextResponse.json({ success: true, results });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = any;

/**
 * Check if a message of a specific template type has already been sent
 * for a given reservation. Checks both template_id linkage and subject matching.
 */
async function hasMessageOfType(
  supabase: SupabaseAdmin,
  reservationId: string,
  organisationId: string,
  type: "CONFIRMATION" | "RAPPEL" | "REMERCIEMENT"
): Promise<boolean> {
  // Check via template_id
  const { data: templates } = await supabase
    .from("message_templates")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("type", type)
    .limit(10);

  if (templates && templates.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const templateIds = templates.map((t: any) => t.id);
    const { data: msgs } = await supabase
      .from("guest_messages")
      .select("id")
      .eq("reservation_id", reservationId)
      .in("template_id", templateIds)
      .in("status", ["SENT", "PENDING"])
      .limit(1);

    if (msgs && msgs.length > 0) return true;
  }

  // Also check by default subject keyword match as fallback
  const subjectKeyword = type === "CONFIRMATION"
    ? "Confirmation"
    : type === "RAPPEL"
    ? "Rappel"
    : "Merci";

  const { data: subjectMsgs } = await supabase
    .from("guest_messages")
    .select("id")
    .eq("reservation_id", reservationId)
    .eq("organisation_id", organisationId)
    .ilike("subject", `%${subjectKeyword}%`)
    .in("status", ["SENT", "PENDING"])
    .limit(1);

  return !!(subjectMsgs && subjectMsgs.length > 0);
}

/**
 * Get the org's active template for a given type, or fall back to defaults.
 */
async function getOrgTemplate(
  supabase: SupabaseAdmin,
  organisationId: string,
  type: "CONFIRMATION" | "RAPPEL" | "REMERCIEMENT"
): Promise<{ id: string | null; subject: string; body: string }> {
  const { data: template } = await supabase
    .from("message_templates")
    .select("id, subject, body")
    .eq("organisation_id", organisationId)
    .eq("type", type)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (template) {
    return { id: template.id, subject: template.subject, body: template.body };
  }

  // Fall back to defaults
  const defaults = DEFAULT_TEMPLATES[type];
  return { id: null, subject: defaults.subject, body: defaults.body };
}

/**
 * Build template variables from reservation + logement data
 */
function buildVars(
  reservation: {
    guest_name: string;
    check_in_date: string;
    check_out_date: string;
  },
  logement: {
    name: string;
    lockbox_code: string | null;
    wifi_name: string | null;
    wifi_password: string | null;
  } | null
): TemplateVars {
  return {
    guest_name: reservation.guest_name ?? "",
    logement_name: logement?.name ?? "",
    check_in_date: reservation.check_in_date
      ? new Date(reservation.check_in_date).toLocaleDateString("fr-FR")
      : "",
    check_out_date: reservation.check_out_date
      ? new Date(reservation.check_out_date).toLocaleDateString("fr-FR")
      : "",
    lockbox_code: logement?.lockbox_code ?? "",
    wifi_name: logement?.wifi_name ?? "",
    wifi_password: logement?.wifi_password ?? "",
  };
}
