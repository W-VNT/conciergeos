import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Auto Check-in Cron (R11)
 *
 * Runs periodically to find reservations with check-in in the next 24 hours
 * that haven't had access info sent yet.
 * For each, generates a guest portal token and creates a guest_message (ACCES type)
 * with the portal link, then marks it as SENT.
 */
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nowDateStr = now.toISOString().split("T")[0];
  const in24hDateStr = in24h.toISOString().split("T")[0];

  // Find confirmed reservations with check-in within next 24 hours
  const { data: reservations, error: resError } = await supabase
    .from("reservations")
    .select("id, organisation_id, guest_name, guest_email, guest_phone, check_in_date, check_out_date, logement:logements(name, lockbox_code, wifi_name, wifi_password)")
    .eq("status", "CONFIRMEE")
    .gte("check_in_date", nowDateStr)
    .lte("check_in_date", in24hDateStr);

  if (resError) {
    console.error("auto-checkin: Error fetching reservations:", resError);
    return NextResponse.json({ error: resError.message }, { status: 500 });
  }

  if (!reservations || reservations.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "No upcoming check-ins" });
  }

  let processed = 0;
  let skipped = 0;

  for (const reservation of reservations) {
    // Check if an ACCES message has already been sent for this reservation
    const { data: existingAccess } = await supabase
      .from("guest_messages")
      .select("id")
      .eq("reservation_id", reservation.id)
      .eq("organisation_id", reservation.organisation_id)
      .in("status", ["SENT", "PENDING"])
      .limit(1);

    // Check if any message exists that was sent for access info
    const { data: existingAccessTyped } = await supabase
      .from("guest_messages")
      .select("id")
      .eq("reservation_id", reservation.id)
      .eq("organisation_id", reservation.organisation_id)
      .ilike("subject", "%accès%")
      .limit(1);

    // Also check for a guest_messages linked to an ACCES template
    const { data: accesTemplates } = await supabase
      .from("message_templates")
      .select("id")
      .eq("organisation_id", reservation.organisation_id)
      .eq("type", "ACCES")
      .eq("active", true)
      .limit(1);

    // Check if any message from an ACCES template was sent
    let alreadySent = false;
    if (accesTemplates && accesTemplates.length > 0) {
      const templateIds = accesTemplates.map((t) => t.id);
      const { data: existingTemplateMsg } = await supabase
        .from("guest_messages")
        .select("id")
        .eq("reservation_id", reservation.id)
        .in("template_id", templateIds)
        .in("status", ["SENT", "PENDING"])
        .limit(1);

      if (existingTemplateMsg && existingTemplateMsg.length > 0) {
        alreadySent = true;
      }
    }

    // If we already detected any access-type message, skip
    if (alreadySent || (existingAccessTyped && existingAccessTyped.length > 0)) {
      skipped++;
      continue;
    }

    // Determine recipient
    const recipient = reservation.guest_email || reservation.guest_phone;
    if (!recipient) {
      skipped++;
      continue;
    }

    const channel = reservation.guest_email ? "EMAIL" : "SMS";

    // Generate a guest portal token
    const token = crypto.randomUUID() + "-" + crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Check if a token already exists
    const { data: existingToken } = await supabase
      .from("guest_portal_tokens")
      .select("id, token")
      .eq("reservation_id", reservation.id)
      .maybeSingle();

    let portalToken = token;

    if (existingToken) {
      // Update existing token
      await supabase
        .from("guest_portal_tokens")
        .update({ token, expires_at: expiresAt.toISOString() })
        .eq("id", existingToken.id);
      portalToken = token;
    } else {
      const { error: tokenError } = await supabase
        .from("guest_portal_tokens")
        .insert({
          reservation_id: reservation.id,
          token,
          expires_at: expiresAt.toISOString(),
        });

      if (tokenError) {
        console.error(`auto-checkin: Token creation failed for reservation ${reservation.id}:`, tokenError);
        continue;
      }
    }

    const portalUrl = `${baseUrl}/guest/${portalToken}`;
    const logement = reservation.logement as unknown as { name: string; lockbox_code: string | null; wifi_name: string | null; wifi_password: string | null } | null;

    // Find org's ACCES template if it exists
    let subject = `Informations d'accès pour votre séjour`;
    let body = `Bonjour ${reservation.guest_name},\n\nVotre check-in approche ! Voici les informations pour accéder à votre logement :\n\n`;

    if (logement) {
      body += `Logement : ${logement.name}\n`;
      if (logement.lockbox_code) {
        body += `Code boîte à clés : ${logement.lockbox_code}\n`;
      }
      if (logement.wifi_name) {
        body += `WiFi : ${logement.wifi_name}\n`;
      }
      if (logement.wifi_password) {
        body += `Mot de passe WiFi : ${logement.wifi_password}\n`;
      }
    }

    body += `\nRetrouvez toutes les informations sur votre portail voyageur :\n${portalUrl}\n\nBon séjour !`;

    // Check if org has a custom ACCES template
    let templateId: string | null = null;
    if (accesTemplates && accesTemplates.length > 0) {
      templateId = accesTemplates[0].id;
      const { data: tpl } = await supabase
        .from("message_templates")
        .select("subject, body")
        .eq("id", templateId)
        .single();

      if (tpl) {
        // Replace variables in the template
        const replacements: Record<string, string> = {
          "{{guest_name}}": reservation.guest_name ?? "",
          "{{logement_name}}": logement?.name ?? "",
          "{{check_in_date}}": reservation.check_in_date
            ? new Date(reservation.check_in_date).toLocaleDateString("fr-FR")
            : "",
          "{{check_out_date}}": reservation.check_out_date
            ? new Date(reservation.check_out_date).toLocaleDateString("fr-FR")
            : "",
          "{{lockbox_code}}": logement?.lockbox_code ?? "",
          "{{wifi_name}}": logement?.wifi_name ?? "",
          "{{wifi_password}}": logement?.wifi_password ?? "",
        };

        subject = tpl.subject;
        body = tpl.body;

        for (const [key, value] of Object.entries(replacements)) {
          subject = subject.replaceAll(key, value);
          body = body.replaceAll(key, value);
        }

        // Append portal link if not already in template
        if (!body.includes(portalUrl)) {
          body += `\n\nPortail voyageur : ${portalUrl}`;
        }
      }
    }

    // Create the guest message
    const { error: msgError } = await supabase
      .from("guest_messages")
      .insert({
        organisation_id: reservation.organisation_id,
        reservation_id: reservation.id,
        template_id: templateId,
        channel,
        recipient,
        subject,
        body,
        status: "SENT",
        sent_at: new Date().toISOString(),
      });

    if (msgError) {
      console.error(`auto-checkin: Message creation failed for reservation ${reservation.id}:`, msgError);
      continue;
    }

    console.log(`[auto-checkin] Sent access info to ${recipient} for reservation ${reservation.id}`);
    processed++;
  }

  return NextResponse.json({
    success: true,
    processed,
    skipped,
    total: reservations.length,
  });
}
