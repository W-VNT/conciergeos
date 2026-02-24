import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  let escalated = 0;
  const now = new Date();

  // -----------------------------------------------------------------
  // 1. MINEUR → MOYEN : incidents OUVERT with severity MINEUR
  //    where opened_at < now() - 48 hours
  // -----------------------------------------------------------------
  const threshold48h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  const { data: mineurIncidents } = await supabase
    .from("incidents")
    .select("id, organisation_id, description")
    .eq("status", "OUVERT")
    .eq("severity", "MINEUR")
    .lt("opened_at", threshold48h);

  if (mineurIncidents && mineurIncidents.length > 0) {
    for (const incident of mineurIncidents) {
      // Escalate severity to MOYEN
      const { error: updateError } = await supabase
        .from("incidents")
        .update({ severity: "MOYEN", updated_at: now.toISOString() })
        .eq("id", incident.id);

      if (updateError) {
        console.error(`Failed to escalate incident ${incident.id} to MOYEN:`, updateError);
        continue;
      }

      // Get admin/manager users for this org to notify
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("organisation_id", incident.organisation_id)
        .in("role", ["ADMIN", "MANAGER"]);

      if (admins) {
        for (const admin of admins) {
          await supabase.from("notifications").insert({
            organisation_id: incident.organisation_id,
            user_id: admin.id,
            type: "INCIDENT_CRITICAL",
            title: "Incident escaladé : MINEUR → MOYEN",
            message: `L'incident "${(incident.description ?? "Sans description").substring(0, 80)}" a été automatiquement escaladé de MINEUR à MOYEN après 48h sans résolution.`,
            entity_type: "INCIDENT",
            entity_id: incident.id,
          });
        }
      }

      escalated++;
    }
  }

  // -----------------------------------------------------------------
  // 2. MOYEN → CRITIQUE : incidents OUVERT or EN_COURS with severity MOYEN
  //    where opened_at < now() - 72 hours
  // -----------------------------------------------------------------
  const threshold72h = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();

  const { data: moyenIncidents } = await supabase
    .from("incidents")
    .select("id, organisation_id, description")
    .in("status", ["OUVERT", "EN_COURS"])
    .eq("severity", "MOYEN")
    .lt("opened_at", threshold72h);

  if (moyenIncidents && moyenIncidents.length > 0) {
    for (const incident of moyenIncidents) {
      // Escalate severity to CRITIQUE
      const { error: updateError } = await supabase
        .from("incidents")
        .update({ severity: "CRITIQUE", updated_at: now.toISOString() })
        .eq("id", incident.id);

      if (updateError) {
        console.error(`Failed to escalate incident ${incident.id} to CRITIQUE:`, updateError);
        continue;
      }

      // Get admin/manager users for this org to notify
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("organisation_id", incident.organisation_id)
        .in("role", ["ADMIN", "MANAGER"]);

      if (admins) {
        for (const admin of admins) {
          await supabase.from("notifications").insert({
            organisation_id: incident.organisation_id,
            user_id: admin.id,
            type: "INCIDENT_CRITICAL",
            title: "Incident escaladé : MOYEN → CRITIQUE",
            message: `L'incident "${(incident.description ?? "Sans description").substring(0, 80)}" a été automatiquement escaladé de MOYEN à CRITIQUE après 72h sans résolution.`,
            entity_type: "INCIDENT",
            entity_id: incident.id,
          });
        }
      }

      escalated++;
    }
  }

  return NextResponse.json({ success: true, escalated });
}
