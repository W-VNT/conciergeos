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
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">📋 Nouvelle mission assignée</h2>
        <p>Bonjour ${data.operatorName},</p>
        <p>Une nouvelle mission vous a été assignée :</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 8px 0;"><strong>Type :</strong> ${data.missionType}</p>
          <p style="margin: 8px 0;"><strong>Logement :</strong> ${data.logementName}</p>
          <p style="margin: 8px 0;"><strong>Date :</strong> ${data.scheduledAt}</p>
        </div>
        <a href="${data.missionUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Voir la mission
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          ConciergeOS - Gestion de conciergerie
        </p>
      </div>
    `,
  };
}

serve(async (req) => {
  try {
    // Parse request body
    const { missionId } = await req.json();

    if (!missionId) {
      return new Response(
        JSON.stringify({ error: "missionId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-mission-email] Processing mission ${missionId}`);

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch mission details with related data
    const { data: mission, error: missionError } = await supabase
      .from("missions")
      .select(`
        *,
        assignee:profiles!assigned_to(email, full_name),
        logement:logements(name)
      `)
      .eq("id", missionId)
      .single();

    if (missionError) {
      console.error(`[send-mission-email] Error fetching mission:`, missionError);
      return new Response(
        JSON.stringify({ error: `Mission not found: ${missionError.message}` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if assignee has email
    if (!mission.assignee?.email) {
      console.log(`[send-mission-email] Mission ${missionId} has no assignee email, skipping`);
      return new Response(
        JSON.stringify({ message: "Mission has no assignee email, skipped" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Format scheduled date
    const scheduledDate = new Date(mission.scheduled_at);
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
      operatorName: mission.assignee.full_name,
      missionType: MISSION_TYPE_LABELS[mission.type] || mission.type,
      logementName: mission.logement?.name || "Non spécifié",
      scheduledAt: scheduledAtFormatted,
      missionUrl: `${APP_URL}/missions/${mission.id}`,
    });

    console.log(`[send-mission-email] Sending email to ${mission.assignee.email}`);

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ConciergeOS <noreply@classazur.fr>",
        to: mission.assignee.email,
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
        to: mission.assignee.email
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
