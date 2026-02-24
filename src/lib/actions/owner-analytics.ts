"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export interface OwnerFinanceSummary {
  proprietaire_id: string;
  proprietaire_name: string;
  nb_logements: number;
  total_ca_brut: number;
  total_commissions: number;
  total_net: number;
}

/**
 * Get finance dashboard data for all owners in the organisation.
 * For each proprietaire with active contrats:
 *   - name, number of logements, total CA brut, commissions, net
 * Sorted by total CA desc.
 */
export async function getOwnerFinanceDashboard(
  organisationId: string,
  startDate?: Date,
  endDate?: Date
): Promise<OwnerFinanceSummary[]> {
  const supabase = createClient();

  // Get all active contrats with their proprietaire and logement info
  const { data: contrats, error: contratsError } = await supabase
    .from("contrats")
    .select("proprietaire_id, logement_id, proprietaire:proprietaires(id, full_name)")
    .eq("organisation_id", organisationId)
    .eq("status", "ACTIF");

  if (contratsError) throw new Error(contratsError.message);
  if (!contrats || contrats.length === 0) return [];

  // Build a map: proprietaire_id -> { name, logement_ids }
  const ownerMap = new Map<
    string,
    { name: string; logementIds: Set<string> }
  >();

  for (const c of contrats) {
    const prop = Array.isArray(c.proprietaire)
      ? c.proprietaire[0]
      : c.proprietaire;
    if (!prop || !c.logement_id) continue;

    if (!ownerMap.has(c.proprietaire_id)) {
      ownerMap.set(c.proprietaire_id, {
        name: prop.full_name,
        logementIds: new Set(),
      });
    }
    ownerMap.get(c.proprietaire_id)!.logementIds.add(c.logement_id);
  }

  // Get all logement_ids that belong to owners
  const allLogementIds = Array.from(
    new Set(
      Array.from(ownerMap.values()).flatMap((o) => Array.from(o.logementIds))
    )
  );

  if (allLogementIds.length === 0) return [];

  // Fetch revenus for those logements
  let revenusQuery = supabase
    .from("revenus")
    .select("logement_id, montant_brut, montant_commission, montant_net")
    .eq("organisation_id", organisationId)
    .in("logement_id", allLogementIds);

  if (startDate) {
    revenusQuery = revenusQuery.gte(
      "date_checkin",
      startDate.toISOString().split("T")[0]
    );
  }
  if (endDate) {
    revenusQuery = revenusQuery.lte(
      "date_checkin",
      endDate.toISOString().split("T")[0]
    );
  }

  const { data: revenus, error: revenusError } = await revenusQuery;
  if (revenusError) throw new Error(revenusError.message);

  // Index revenus by logement_id
  const revenusByLogement = new Map<
    string,
    { brut: number; commissions: number; net: number }
  >();

  for (const r of revenus || []) {
    const existing = revenusByLogement.get(r.logement_id) || {
      brut: 0,
      commissions: 0,
      net: 0,
    };
    existing.brut += Number(r.montant_brut || 0);
    existing.commissions += Number(r.montant_commission || 0);
    existing.net += Number(r.montant_net || 0);
    revenusByLogement.set(r.logement_id, existing);
  }

  // Aggregate per owner
  const results: OwnerFinanceSummary[] = [];

  Array.from(ownerMap.entries()).forEach(([proprietaireId, owner]) => {
    let totalCaBrut = 0;
    let totalCommissions = 0;
    let totalNet = 0;

    Array.from(owner.logementIds).forEach((logementId) => {
      const rev = revenusByLogement.get(logementId);
      if (rev) {
        totalCaBrut += rev.brut;
        totalCommissions += rev.commissions;
        totalNet += rev.net;
      }
    });

    results.push({
      proprietaire_id: proprietaireId,
      proprietaire_name: owner.name,
      nb_logements: owner.logementIds.size,
      total_ca_brut: totalCaBrut,
      total_commissions: totalCommissions,
      total_net: totalNet,
    });
  });

  // Sort by total CA desc
  results.sort((a, b) => b.total_ca_brut - a.total_ca_brut);

  return results;
}

export interface ProprietaireFinanceSummary {
  total_ca_brut: number;
  total_commissions: number;
  total_net: number;
  nb_reservations: number;
}

/**
 * Get finance summary for a specific proprietaire.
 * Returns total CA brut, commissions, net, and number of reservations
 * for logements owned by this proprietaire.
 */
export async function getProprietaireFinances(
  proprietaireId: string,
  organisationId: string
): Promise<ProprietaireFinanceSummary> {
  const supabase = createClient();

  // Get logements for this proprietaire via active contrats
  const { data: contrats, error: contratsError } = await supabase
    .from("contrats")
    .select("logement_id")
    .eq("organisation_id", organisationId)
    .eq("proprietaire_id", proprietaireId)
    .eq("status", "ACTIF");

  if (contratsError) throw new Error(contratsError.message);

  const logementIds = (contrats || [])
    .map((c) => c.logement_id)
    .filter((id): id is string => id !== null);

  if (logementIds.length === 0) {
    return {
      total_ca_brut: 0,
      total_commissions: 0,
      total_net: 0,
      nb_reservations: 0,
    };
  }

  // Fetch revenus for those logements
  const { data: revenus, error: revenusError } = await supabase
    .from("revenus")
    .select("montant_brut, montant_commission, montant_net")
    .eq("organisation_id", organisationId)
    .in("logement_id", logementIds);

  if (revenusError) throw new Error(revenusError.message);

  const totalCaBrut = (revenus || []).reduce(
    (sum, r) => sum + Number(r.montant_brut || 0),
    0
  );
  const totalCommissions = (revenus || []).reduce(
    (sum, r) => sum + Number(r.montant_commission || 0),
    0
  );
  const totalNet = (revenus || []).reduce(
    (sum, r) => sum + Number(r.montant_net || 0),
    0
  );

  return {
    total_ca_brut: totalCaBrut,
    total_commissions: totalCommissions,
    total_net: totalNet,
    nb_reservations: revenus?.length ?? 0,
  };
}
