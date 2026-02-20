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
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Résumé quotidien des missions</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📋 Résumé des missions</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">${data.date}</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
              Bonjour ${data.adminName},
            </p>
            <p style="margin: 0 0 30px; color: #6b7280; font-size: 14px;">
              Voici le résumé des <strong>${data.missions.length} mission${data.missions.length > 1 ? 's' : ''}</strong> prévue${data.missions.length > 1 ? 's' : ''} aujourd'hui :
            </p>

            <!-- Missions List -->
            ${data.missions.map((mission) => `
              <div style="border-left: 4px solid #667eea; background-color: #f9fafb; padding: 15px; margin-bottom: 15px; border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                  <div>
                    <h3 style="margin: 0 0 5px; color: #111827; font-size: 16px;">${mission.type}</h3>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">📍 ${mission.logement}</p>
                  </div>
                  <span style="background-color: #667eea; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">${mission.time}</span>
                </div>
                <div style="font-size: 13px; color: #6b7280;">
                  <span>👤 ${mission.assignee}</span>
                  <span> • ${mission.status}</span>
                </div>
                <a href="${mission.url}" style="display: inline-block; margin-top: 10px; color: #667eea; text-decoration: none; font-size: 13px; font-weight: 500;">
                  Voir les détails →
                </a>
              </div>
            `).join('')}

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                Voir le tableau de bord
              </a>
            </div>

            <!-- Footer note -->
            <p style="margin: 20px 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center;">
              Vous recevez cet email quotidiennement en tant qu'administrateur ConciergeOS
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
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
