"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export interface PrestataireStats {
  total_incidents: number;
  incidents_resolved: number;
  avg_resolution_hours: number;
  total_cost: number;
}

/**
 * Compute statistics for a given prestataire:
 *  - Total incidents assigned
 *  - Incidents resolved (status RESOLU or CLOS)
 *  - Average resolution time in hours (opened_at to resolved_at)
 *  - Total cost of all incidents
 */
export async function getPrestataireStats(
  prestataireId: string,
  organisationId: string
): Promise<PrestataireStats> {
  const profile = await requireProfile();
  if (profile.organisation_id !== organisationId) throw new Error("Non autorisé");
  const supabase = await createClient();

  const { data: incidents } = await supabase
    .from("incidents")
    .select("id, status, cost, opened_at, resolved_at")
    .eq("prestataire_id", prestataireId)
    .eq("organisation_id", organisationId);

  const allIncidents = incidents ?? [];
  const total_incidents = allIncidents.length;

  const resolved = allIncidents.filter(
    (i) => i.status === "RESOLU" || i.status === "CLOS"
  );
  const incidents_resolved = resolved.length;

  // Average resolution time
  const resolutionTimes = resolved
    .filter((i) => i.opened_at && i.resolved_at)
    .map((i) => {
      const opened = new Date(i.opened_at).getTime();
      const resolvedAt = new Date(i.resolved_at!).getTime();
      return (resolvedAt - opened) / (1000 * 60 * 60); // hours
    })
    .filter((h) => h >= 0);

  const avg_resolution_hours =
    resolutionTimes.length > 0
      ? Math.round(
          resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        )
      : 0;

  // Total cost
  const total_cost = allIncidents.reduce(
    (sum, i) => sum + (i.cost ?? 0),
    0
  );

  return {
    total_incidents,
    incidents_resolved,
    avg_resolution_hours,
    total_cost,
  };
}
