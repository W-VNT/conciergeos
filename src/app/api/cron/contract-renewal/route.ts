import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ALERT_DAYS = [30, 14, 7];

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

  let notified = 0;
  let renewed = 0;

  // ── Part 1: Send notifications for contracts expiring in 30/14/7 days ──
  for (const days of ALERT_DAYS) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const dateStr = targetDate.toISOString().split("T")[0];

    // Find auto-renew contracts expiring on this exact date
    const { data: contracts } = await supabase
      .from("contrats")
      .select("id, end_date, organisation_id, renewal_duration_months, renewal_notified_at, proprietaire:proprietaires(full_name)")
      .eq("auto_renew", true)
      .eq("status", "ACTIF")
      .eq("end_date", dateStr);

    if (!contracts || contracts.length === 0) continue;

    for (const contract of contracts) {
      // Check if already notified for this threshold
      // We use renewal_notified_at to prevent duplicate notifications.
      // Only notify if not already notified in the last (days - 1) days
      // (i.e., a new threshold was reached)
      if (contract.renewal_notified_at) {
        const lastNotified = new Date(contract.renewal_notified_at);
        const daysSinceNotified = Math.floor(
          (Date.now() - lastNotified.getTime()) / (1000 * 60 * 60 * 24)
        );
        // If notified less than 6 days ago and this is the 7-day alert, skip
        // We allow re-notification at each threshold (30, 14, 7)
        if (daysSinceNotified < 5) continue;
      }

      const propRaw = contract.proprietaire as unknown;
      const prop = Array.isArray(propRaw)
        ? (propRaw[0] as { full_name: string } | undefined)
        : (propRaw as { full_name: string } | null);

      // Get admin users for this org
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("organisation_id", contract.organisation_id)
        .eq("role", "ADMIN");

      if (!admins || admins.length === 0) continue;

      for (const admin of admins) {
        await supabase.from("notifications").insert({
          organisation_id: contract.organisation_id,
          user_id: admin.id,
          type: "CONTRACT_EXPIRING",
          title: `Reconduction automatique dans ${days} jours`,
          message: `Le contrat avec ${prop?.full_name ?? "inconnu"} sera automatiquement reconduit de ${contract.renewal_duration_months} mois le ${new Date(contract.end_date).toLocaleDateString("fr-FR")}.`,
          entity_type: "CONTRAT",
          entity_id: contract.id,
        });
      }

      // Update renewal_notified_at
      await supabase
        .from("contrats")
        .update({ renewal_notified_at: new Date().toISOString() })
        .eq("id", contract.id);

      notified++;
    }
  }

  // ── Part 2: Renew expired contracts with auto_renew = true ──
  const today = new Date().toISOString().split("T")[0];

  const { data: expiredContracts } = await supabase
    .from("contrats")
    .select("id, end_date, renewal_duration_months, organisation_id, proprietaire:proprietaires(full_name)")
    .eq("auto_renew", true)
    .eq("status", "ACTIF")
    .lt("end_date", today);

  if (expiredContracts && expiredContracts.length > 0) {
    for (const contract of expiredContracts) {
      // Calculate new end_date by adding renewal_duration_months to the current end_date
      const currentEnd = new Date(contract.end_date);
      const newEnd = new Date(currentEnd);
      newEnd.setMonth(newEnd.getMonth() + (contract.renewal_duration_months || 12));
      const newEndStr = newEnd.toISOString().split("T")[0];

      const { error: updateError } = await supabase
        .from("contrats")
        .update({
          end_date: newEndStr,
          renewal_notified_at: null, // Reset notification for the next cycle
        })
        .eq("id", contract.id);

      if (updateError) {
        console.error(`Failed to renew contract ${contract.id}:`, updateError);
        continue;
      }

      const propRaw = contract.proprietaire as unknown;
      const prop = Array.isArray(propRaw)
        ? (propRaw[0] as { full_name: string } | undefined)
        : (propRaw as { full_name: string } | null);

      // Notify admins of the renewal
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("organisation_id", contract.organisation_id)
        .eq("role", "ADMIN");

      if (admins) {
        for (const admin of admins) {
          await supabase.from("notifications").insert({
            organisation_id: contract.organisation_id,
            user_id: admin.id,
            type: "CONTRACT_EXPIRING",
            title: "Contrat reconduit automatiquement",
            message: `Le contrat avec ${prop?.full_name ?? "inconnu"} a été automatiquement reconduit jusqu'au ${newEnd.toLocaleDateString("fr-FR")}.`,
            entity_type: "CONTRAT",
            entity_id: contract.id,
          });
        }
      }

      renewed++;
    }
  }

  return NextResponse.json({ success: true, notified, renewed });
}
