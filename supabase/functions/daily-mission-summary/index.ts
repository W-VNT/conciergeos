import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") || "https://conciergeos.vercel.app";

// Mission type labels
const MISSION_TYPE_LABELS: Record<string, string> = {
  CHECKIN: 'Check-in',
  CHECKOUT: 'Check-out',
  MENAGE: 'Ménage',
  INTERVENTION: 'Intervention',
  URGENCE: 'Urgence',
};

// Mission status labels
const MISSION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

// Email template function
function dailySummaryEmail(data: {
  adminName: string;
  date: string;
  missions: Array<{
    type: string;
    logement: string;
    time: string;
    assignee: string;
    status: string;
    url: string;
  }>;
  dashboardUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `📋 Résumé des missions du ${data.date}`,
    html: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Résumé quotidien des missions</title>
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
                    📋 Résumé quotidien
                  </div>
                </div>
                <h2 style="color: #0a0a0a; font-size: 28px; font-weight: 700; margin: 0 0 20px 0; text-align: center; line-height: 1.3;">
                  Bonjour <span style="color: #171717;">${data.adminName}</span>
                </h2>
                <p style="font-size: 17px; color: #525252; line-height: 1.7; margin: 0 0 30px 0; text-align: center;">
                  Voici le résumé de vos <strong>${data.missions.length} mission${data.missions.length > 1 ? 's' : ''}</strong> prévue${data.missions.length > 1 ? 's' : ''} pour <strong>${data.date}</strong>
                </p>

                <!-- Missions List -->
                ${data.missions.map((mission) => `
                  <div style="background: #fafafa; border-left: 4px solid #171717; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="margin: 0; color: #0a0a0a; font-size: 18px; font-weight: 700;">${mission.type}</h3>
                            <span style="background: linear-gradient(135deg, #171717 0%, #262626 100%); color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">${mission.time}</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #e5e5e5;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="24" style="vertical-align: top; padding-top: 2px;"><span style="font-size: 16px;">📍</span></td>
                              <td>
                                <div style="color: #737373; font-size: 13px; margin-bottom: 2px;">Logement</div>
                                <div style="color: #0a0a0a; font-size: 15px; font-weight: 600;">${mission.logement}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="24" style="vertical-align: top; padding-top: 2px;"><span style="font-size: 16px;">👤</span></td>
                              <td>
                                <div style="color: #737373; font-size: 13px; margin-bottom: 2px;">Assigné à</div>
                                <div style="color: #0a0a0a; font-size: 15px; font-weight: 600;">${mission.assignee}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="24" style="vertical-align: top; padding-top: 2px;"><span style="font-size: 16px;">📊</span></td>
                              <td>
                                <div style="color: #737373; font-size: 13px; margin-bottom: 2px;">Statut</div>
                                <div style="color: #0a0a0a; font-size: 15px; font-weight: 600;">${mission.status}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 12px;">
                          <a href="${mission.url}" style="color: #171717; text-decoration: none; font-size: 14px; font-weight: 600;">
                            Voir les détails →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </div>
                `).join('')}

                <div style="text-align: center; padding: 40px 0;">
                  <a href="${data.dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #171717 0%, #0a0a0a 100%); color: white; padding: 18px 48px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 18px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);">
                    Voir le tableau de bord →
                  </a>
                </div>

                <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-top: 30px;">
                  <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.6;">
                    📬 <strong>Résumé quotidien :</strong> Vous recevez cet email tous les jours pour suivre les missions planifiées.
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
    console.log(`[daily-mission-summary] Starting daily summary`);

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all admins
    const { data: admins, error: adminsError } = await supabase
      .from("profiles")
      .select("email, full_name, organisation_id")
      .eq("role", "ADMIN");

    if (adminsError) {
      console.error(`[daily-mission-summary] Error fetching admins:`, adminsError);
      return new Response(
        JSON.stringify({ error: `Failed to fetch admins: ${adminsError.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!admins || admins.length === 0) {
      console.log(`[daily-mission-summary] No admins found`);
      return new Response(
        JSON.stringify({ message: "No admins found, skipped" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    let emailsSent = 0;

    // Get today's date range
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    for (const admin of admins) {
      if (!admin.email) {
        console.log(`[daily-mission-summary] Admin ${admin.full_name} has no email, skipping`);
        continue;
      }

      // Get today's missions for this organization
      const { data: missions, error: missionsError } = await supabase
        .from("missions")
        .select(`
          *,
          assignee:profiles!assigned_to(full_name),
          logement:logements(name)
        `)
        .eq("organisation_id", admin.organisation_id)
        .gte("scheduled_at", todayStart)
        .lt("scheduled_at", todayEnd)
        .order("scheduled_at");

      if (missionsError) {
        console.error(`[daily-mission-summary] Error fetching missions for admin ${admin.email}:`, missionsError);
        continue;
      }

      if (!missions || missions.length === 0) {
        console.log(`[daily-mission-summary] No missions for admin ${admin.email}, skipping`);
        continue;
      }

      // Format date
      const dateFormatted = today.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Generate email content
      const emailTemplate = dailySummaryEmail({
        adminName: admin.full_name,
        date: dateFormatted,
        missions: missions.map(m => ({
          type: MISSION_TYPE_LABELS[m.type] || m.type,
          logement: m.logement?.name || "Non spécifié",
          time: new Date(m.scheduled_at).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          assignee: m.assignee?.full_name || "Non assigné",
          status: MISSION_STATUS_LABELS[m.status] || m.status,
          url: `${APP_URL}/missions/${m.id}`,
        })),
        dashboardUrl: `${APP_URL}/dashboard`,
      });

      console.log(`[daily-mission-summary] Sending email to ${admin.email} (${missions.length} missions)`);

      // Send email via Resend
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "ConciergeOS <noreply@classazur.fr>",
          to: admin.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        }),
      });

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        console.error(`[daily-mission-summary] Resend API error for ${admin.email}:`, errorText);
        continue;
      }

      const resendData = await resendResponse.json();
      console.log(`[daily-mission-summary] Email sent to ${admin.email}:`, resendData);
      emailsSent++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        adminsProcessed: admins.length,
        emailsSent
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error(`[daily-mission-summary] Error:`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
