"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import ICAL from "ical.js";

export async function syncIcal(logementId: string) {
  const profile = await requireProfile();
  const supabase = createClient();

  // Get logement with ical_url
  const { data: logement } = await supabase
    .from("logements")
    .select("id, name, ical_url, organisation_id")
    .eq("id", logementId)
    .eq("organisation_id", profile.organisation_id)
    .single();

  if (!logement || !logement.ical_url) {
    throw new Error("Logement non trouvé ou URL iCal manquante");
  }

  try {
    // Fetch iCal file
    const response = await fetch(logement.ical_url);
    if (!response.ok) {
      throw new Error("Impossible de récupérer le calendrier iCal");
    }

    const icalData = await response.text();

    // Parse iCal using ical.js
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);

      // Extract event data
      const summary = event.summary || "Réservation";
      const startDate = event.startDate.toJSDate();
      const endDate = event.endDate.toJSDate();
      const uid = event.uid;

      // Skip past events
      if (endDate < new Date()) {
        skipped++;
        continue;
      }

      // Format dates for database (YYYY-MM-DD)
      const checkInDate = startDate.toISOString().split("T")[0];
      const checkOutDate = endDate.toISOString().split("T")[0];

      // Upsert reservation by logement + dates to avoid race conditions
      const { data: upserted, error: upsertError } = await supabase
        .from("reservations")
        .upsert(
          {
            organisation_id: profile.organisation_id,
            logement_id: logementId,
            guest_name: summary,
            guest_count: 1,
            check_in_date: checkInDate,
            check_out_date: checkOutDate,
            platform: "AUTRE",
            status: "CONFIRMEE",
            notes: `Synchronisé depuis iCal (UID: ${uid})`,
          },
          { onConflict: "logement_id,check_in_date,check_out_date", ignoreDuplicates: false }
        )
        .select("id")
        .single();

      if (upsertError) {
        // Fallback to check-then-insert for tables without unique constraint
        const { data: existing } = await supabase
          .from("reservations")
          .select("id")
          .eq("logement_id", logementId)
          .eq("check_in_date", checkInDate)
          .eq("check_out_date", checkOutDate)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("reservations")
            .update({
              guest_name: summary,
              status: "CONFIRMEE",
              platform: "AUTRE",
              notes: `Synchronisé depuis iCal (UID: ${uid})`,
            })
            .eq("id", existing.id);
          updated++;
        } else {
          await supabase.from("reservations").insert({
            organisation_id: profile.organisation_id,
            logement_id: logementId,
            guest_name: summary,
            guest_count: 1,
            check_in_date: checkInDate,
            check_out_date: checkOutDate,
            platform: "AUTRE",
            status: "CONFIRMEE",
            notes: `Synchronisé depuis iCal (UID: ${uid})`,
          });
          created++;
        }
      } else {
        // Upsert succeeded — count based on whether it was an insert or update
        // If upserted, we can't easily distinguish, so count as created
        created++;
      }
    }

    // Update last synced timestamp
    await supabase
      .from("logements")
      .update({ ical_last_synced_at: new Date().toISOString() })
      .eq("id", logementId);

    revalidatePath("/reservations");
    revalidatePath(`/logements/${logementId}`);

    return {
      success: true,
      message: `Synchronisation terminée: ${created} créées, ${updated} mises à jour, ${skipped} ignorées`,
      created,
      updated,
      skipped,
    };
  } catch (error) {
    console.error("iCal sync error:", error);
    throw new Error(
      `Erreur de synchronisation: ${error instanceof Error ? error.message : "erreur inconnue"}`
    );
  }
}

export async function syncAllIcals() {
  const profile = await requireProfile();
  const supabase = createClient();

  // Get all logements with iCal URLs
  const { data: logements } = await supabase
    .from("logements")
    .select("id, name, ical_url")
    .eq("organisation_id", profile.organisation_id)
    .not("ical_url", "is", null)
    .neq("ical_url", "");

  if (!logements || logements.length === 0) {
    return { success: true, message: "Aucun logement avec URL iCal configurée" };
  }

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  for (const logement of logements) {
    try {
      const result = await syncIcal(logement.id);
      totalCreated += result.created;
      totalUpdated += result.updated;
      totalSkipped += result.skipped;
    } catch (error) {
      errors.push(`${logement.name}: ${error instanceof Error ? error.message : "erreur"}`);
    }
  }

  revalidatePath("/reservations");
  revalidatePath("/logements");

  return {
    success: true,
    message: `Synchronisation de ${logements.length} logements terminée: ${totalCreated} créées, ${totalUpdated} mises à jour, ${totalSkipped} ignorées`,
    created: totalCreated,
    updated: totalUpdated,
    skipped: totalSkipped,
    errors,
  };
}
