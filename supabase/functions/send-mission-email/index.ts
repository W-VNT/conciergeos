import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") || "https://conciergeos.vercel.app";

// Mission type labels (inline from types/database.ts)
const MISSION_TYPE_LABELS: Record<string, string> = {
  CHECKIN: 'Check-in',
  CHECKOUT: 'Check-out',
  MENAGE: 'Ménage',
  INTERVENTION: 'Intervention',
  URGENCE: 'Urgence',
};

// Email template function (inline from templates.ts)
function missionAssignedEmail(data: {
  operatorName: string;
  missionType: string;
  logementName: string;
  scheduledAt: string;
  missionUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Nouvelle mission assignée - ${data.missionType}`,
    html: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvelle mission assignée</title>
  </head>
  <body style="margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); max-width: 480px; border: 1px solid #e5e5e5;">
            <tr>
              <td style="background: linear-gradient(135deg, #0f0f0f 0%, #1f1f1f 100%); padding: 40px 30px; text-align: center;">
                <div style="margin-bottom: 16px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 32 32" style="display: inline-block;">
                    <rect width="32" height="32" rx="7" fill="#ffffff" fill-opacity="0.12"/>
                    <g transform="translate(4, 4)" stroke="white" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none">
                      <path d="M10 12h4"/>
                      <path d="M10 8h4"/>
                      <path d="M14 21v-3a2 2 0 0 0-4 0v3"/>
                      <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/>
                      <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>
                    </g>
                  </svg>
                </div>
                <h1 style="color: white; margin: 0 0 8px 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">ConciergeOS</h1>
                <p style="color: rgba(255, 255, 255, 0.6); margin: 0; font-size: 14px; font-weight: 400;">Gestion de conciergerie nouvelle génération</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px;">
                <div style="text-align: center; padding-bottom: 30px;">
                  <div style="background: linear-gradient(135deg, #171717 0%, #262626 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); display: inline-block;">
                    📋 Nouvelle mission
                  </div>
                </div>
                <h2 style="color: #0a0a0a; font-size: 28px; font-weight: 700; margin: 0 0 20px 0; text-align: center; line-height: 1.3;">
                  Bonjour <span style="color: #171717;">${data.operatorName}</span>
                </h2>
                <p style="font-size: 17px; color: #525252; line-height: 1.7; margin: 0 0 30px 0; text-align: center;">
                  Une nouvelle mission <strong>${data.missionType}</strong> vous a été assignée.
                </p>
                <div style="background: #fafafa; border-radius: 12px; padding: 24px; margin: 30px 0;">
                  <div style="margin-bottom: 16px;">
                    <p style="margin: 0 0 8px 0; color: #737373; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Type de mission</p>
                    <p style="margin: 0; color: #0a0a0a; font-size: 18px; font-weight: 700;">${data.missionType}</p>
                  </div>
                  <div style="margin-bottom: 16px;">
                    <p style="margin: 0 0 8px 0; color: #737373; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Logement</p>
                    <p style="margin: 0; color: #0a0a0a; font-size: 16px; font-weight: 600;">${data.logementName}</p>
                  </div>
                  <div>
                    <p style="margin: 0 0 8px 0; color: #737373; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Date et heure</p>
                    <p style="margin: 0; color: #0a0a0a; font-size: 16px; font-weight: 600;">${data.scheduledAt}</p>
                  </div>
                </div>
                <div style="text-align: center; padding: 40px 0;">
                  <a href="${data.missionUrl}" style="display: inline-block; background: linear-gradient(135deg, #171717 0%, #0a0a0a 100%); color: white; padding: 18px 48px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 18px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);">
                    Voir la mission →
                  </a>
                </div>
                <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-top: 30px;">
                  <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.6;">
                    💡 <strong>Conseil :</strong> Consultez les détails de la mission pour accéder aux informations complémentaires et aux documents associés.
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
                <p style="margin: 0 0 16px 0; color: #525252; font-size: 14px; font-weight: 600;">ConciergeOS</p>
                <p style="margin: 0 0 20px 0; color: #737373; font-size: 13px; line-height: 1.6;">
                  La plateforme tout-en-un pour gérer votre conciergerie<br>Réservations • Missions • Incidents • Finances
                </p>
                <p style="margin: 0; color: #a3a3a3; font-size: 12px;">© 2026 ConciergeOS. Tous droits réservés.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}

serve(async (req) => {
  try {
    // Parse request body - now expects all data from trigger
    const {
      missionId,
      missionType,
      assigneeEmail,
      assigneeName,
      logementName,
      scheduledAt
    } = await req.json();

    console.log(`[send-mission-email] Processing mission ${missionId}`);
    console.log(`[send-mission-email] Data received:`, {
      missionType,
      assigneeEmail,
      assigneeName,
      logementName,
      scheduledAt
    });

    // Validate required fields
    if (!missionId || !assigneeEmail) {
      console.error(`[send-mission-email] Missing required fields`);
      return new Response(
        JSON.stringify({ error: "missionId and assigneeEmail are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Format scheduled date
    const scheduledDate = new Date(scheduledAt);
    const scheduledAtFormatted = scheduledDate.toLocaleString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Generate email content
    const emailTemplate = missionAssignedEmail({
      operatorName: assigneeName || "Opérateur",
      missionType: MISSION_TYPE_LABELS[missionType] || missionType,
      logementName: logementName || "Non spécifié",
      scheduledAt: scheduledAtFormatted,
      missionUrl: `${APP_URL}/missions/${missionId}`,
    });

    console.log(`[send-mission-email] Sending email to ${assigneeEmail}`);

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ConciergeOS <noreply@classazur.fr>",
        to: assigneeEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error(`[send-mission-email] Resend API error:`, errorText);
      throw new Error(`Resend API error: ${errorText}`);
    }

    const resendData = await resendResponse.json();
    console.log(`[send-mission-email] Email sent successfully:`, resendData);

    return new Response(
      JSON.stringify({
        success: true,
        emailId: resendData.id,
        to: assigneeEmail
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error(`[send-mission-email] Error:`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
