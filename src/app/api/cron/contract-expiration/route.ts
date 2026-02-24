import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/sender";
import { contractExpiringEmail } from "@/lib/email/templates";

const ALERT_DAYS = [30, 14, 7, 2];

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

  for (const days of ALERT_DAYS) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const dateStr = targetDate.toISOString().split("T")[0];

    // Find active contracts expiring on this exact date
    const { data: contracts } = await supabase
      .from("contrats")
      .select("id, end_date, organisation_id, proprietaire:proprietaires(full_name, email)")
      .eq("status", "ACTIF")
      .eq("end_date", dateStr);

    if (!contracts || contracts.length === 0) continue;

    for (const contract of contracts) {
      const propRaw = contract.proprietaire as unknown;
      const prop = Array.isArray(propRaw) ? propRaw[0] as { full_name: string; email: string | null } | undefined : propRaw as { full_name: string; email: string | null } | null;

      // Get admin users for this org to notify
      const { data: admins } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("organisation_id", contract.organisation_id)
        .eq("role", "ADMIN");

      if (!admins) continue;

      for (const admin of admins) {
        // Create in-app notification
        await supabase.from("notifications").insert({
          organisation_id: contract.organisation_id,
          user_id: admin.id,
          type: "CONTRACT_EXPIRING",
          title: `Contrat expire dans ${days} jours`,
          message: `Le contrat avec ${prop?.full_name ?? "inconnu"} expire le ${new Date(contract.end_date).toLocaleDateString("fr-FR")}`,
          entity_type: "CONTRAT",
          entity_id: contract.id,
        });

        // Send email if admin has email
        if (admin.email) {
          try {
            await sendEmail({
              to: admin.email,
              template: contractExpiringEmail({
                adminName: admin.full_name,
                proprietaireName: prop?.full_name ?? "inconnu",
                daysRemaining: days,
                endDate: new Date(contract.end_date).toLocaleDateString("fr-FR"),
                contractUrl: `${process.env.NEXT_PUBLIC_APP_URL}/contrats/${contract.id}`,
              }),
            });
          } catch (err) {
            console.error("Failed to send contract expiration email:", err);
          }
        }

        notified++;
      }
    }
  }

  return NextResponse.json({ success: true, notified });
}
