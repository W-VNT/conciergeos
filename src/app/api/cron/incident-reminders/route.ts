import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const REMINDER_INTERVAL_DAYS = 7;

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

  // Find incidents with status OUVERT or EN_COURS opened more than 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - REMINDER_INTERVAL_DAYS);

  const { data: incidents, error: incidentsError } = await supabase
    .from("incidents")
    .select("id, description, opened_at, organisation_id, status")
    .in("status", ["OUVERT", "EN_COURS"])
    .lt("opened_at", sevenDaysAgo.toISOString());

  if (incidentsError) {
    console.error("Incident reminders: fetch error:", incidentsError);
    return NextResponse.json({ error: incidentsError.message }, { status: 500 });
  }

  if (!incidents || incidents.length === 0) {
    return NextResponse.json({ success: true, reminders_sent: 0 });
  }

  let remindersSent = 0;

  for (const incident of incidents) {
    // Check if a REMINDER_SENT activity was logged in the last 7 days
    const recentReminderCutoff = new Date();
    recentReminderCutoff.setDate(recentReminderCutoff.getDate() - REMINDER_INTERVAL_DAYS);

    const { data: recentReminder } = await supabase
      .from("activity_logs")
      .select("id")
      .eq("entity_type", "INCIDENT")
      .eq("entity_id", incident.id)
      .eq("action", "REMINDER_SENT")
      .gte("created_at", recentReminderCutoff.toISOString())
      .limit(1);

    if (recentReminder && recentReminder.length > 0) {
      // Already reminded recently, skip
      continue;
    }

    const daysOpen = Math.floor(
      (Date.now() - new Date(incident.opened_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get admin users for this org to notify
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("organisation_id", incident.organisation_id)
      .eq("role", "ADMIN");

    if (!admins || admins.length === 0) continue;

    const descriptionPreview = incident.description?.slice(0, 80) ?? "Sans description";

    for (const admin of admins) {
      // Create in-app notification
      await supabase.from("notifications").insert({
        organisation_id: incident.organisation_id,
        user_id: admin.id,
        type: "SYSTEM",
        title: `Incident ouvert depuis ${daysOpen} jours`,
        message: `Incident "${descriptionPreview}" est ouvert depuis ${daysOpen} jours sans résolution.`,
        entity_type: "INCIDENT",
        entity_id: incident.id,
      });
    }

    // Log the reminder in activity_logs to prevent duplicate reminders
    await supabase.from("activity_logs").insert({
      organisation_id: incident.organisation_id,
      entity_type: "INCIDENT",
      entity_id: incident.id,
      action: "REMINDER_SENT",
      actor_id: null,
      metadata: { days_open: daysOpen },
    });

    remindersSent++;
  }

  return NextResponse.json({ success: true, reminders_sent: remindersSent });
}
