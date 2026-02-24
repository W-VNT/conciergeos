"use server";

import { createClient } from "@/lib/supabase/server";

export interface LogementAnalytics {
  taux_occupation: number; // percentage 0-100
  revenu_moyen_reservation: number;
  ca_total: number;
  nombre_reservations: number;
  missions_en_retard: number;
  incidents_ouverts: number;
}

/**
 * Compute KPIs for a given logement:
 *  - Taux d'occupation (last 90 days): reserved nights / total nights
 *  - Revenu moyen par réservation
 *  - CA total (all time)
 *  - Nombre de réservations (all time)
 *  - Missions en retard (A_FAIRE where scheduled_at < now)
 *  - Incidents ouverts count
 */
export async function getLogementAnalytics(
  logementId: string,
  organisationId: string
): Promise<LogementAnalytics> {
  const supabase = await createClient();
  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const startDate = ninetyDaysAgo.toISOString().split("T")[0];
  const endDate = now.toISOString().split("T")[0];
  const totalNights = 90;

  // Fetch all data in parallel
  const [
    { data: recentReservations },
    { data: allReservations },
    { data: lateMissions },
    { data: openIncidents },
  ] = await Promise.all([
    // Recent confirmed/terminated reservations overlapping last 90 days
    supabase
      .from("reservations")
      .select("check_in_date, check_out_date")
      .eq("logement_id", logementId)
      .eq("organisation_id", organisationId)
      .in("status", ["CONFIRMEE", "TERMINEE"])
      .lte("check_in_date", endDate)
      .gte("check_out_date", startDate),
    // All-time reservations (non-cancelled) for CA and count
    supabase
      .from("reservations")
      .select("id, amount")
      .eq("logement_id", logementId)
      .eq("organisation_id", organisationId)
      .in("status", ["CONFIRMEE", "TERMINEE", "EN_ATTENTE"]),
    // Late missions: still A_FAIRE but scheduled_at is in the past
    supabase
      .from("missions")
      .select("id", { count: "exact" })
      .eq("logement_id", logementId)
      .eq("organisation_id", organisationId)
      .eq("status", "A_FAIRE")
      .lt("scheduled_at", now.toISOString()),
    // Open incidents (not RESOLU / CLOS)
    supabase
      .from("incidents")
      .select("id", { count: "exact" })
      .eq("logement_id", logementId)
      .eq("organisation_id", organisationId)
      .in("status", ["OUVERT", "EN_COURS"]),
  ]);

  // Calculate occupied nights in the last 90 days
  let occupiedNights = 0;
  if (recentReservations && recentReservations.length > 0) {
    const windowStart = ninetyDaysAgo.getTime();
    const windowEnd = now.getTime();

    for (const r of recentReservations) {
      const ciDate = new Date(r.check_in_date).getTime();
      const coDate = new Date(r.check_out_date).getTime();
      const effectiveStart = Math.max(ciDate, windowStart);
      const effectiveEnd = Math.min(coDate, windowEnd);
      if (effectiveEnd > effectiveStart) {
        occupiedNights += Math.ceil(
          (effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)
        );
      }
    }
  }

  const taux_occupation = totalNights > 0
    ? Math.round((occupiedNights / totalNights) * 100)
    : 0;

  // CA total & count
  const reservations = allReservations ?? [];
  const nombre_reservations = reservations.length;
  const ca_total = reservations.reduce(
    (sum, r) => sum + (r.amount ?? 0),
    0
  );
  const revenu_moyen_reservation =
    nombre_reservations > 0
      ? Math.round(ca_total / nombre_reservations)
      : 0;

  return {
    taux_occupation,
    revenu_moyen_reservation,
    ca_total,
    nombre_reservations,
    missions_en_retard: lateMissions?.length ?? 0,
    incidents_ouverts: openIncidents?.length ?? 0,
  };
}
