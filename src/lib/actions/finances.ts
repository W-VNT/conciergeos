"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

/**
 * Get financial summary for a date range
 */
export async function getFinancialSummary(startDate: Date, endDate: Date, logementId?: string) {
  const profile = await requireProfile();
  const supabase = createClient();

  // Query revenus summary
  let revenusQuery = supabase
    .from("revenus")
    .select("montant_brut, montant_commission, montant_net")
    .eq("organisation_id", profile.organisation_id)
    .gte("date_checkin", startDate.toISOString().split("T")[0])
    .lte("date_checkin", endDate.toISOString().split("T")[0]);

  if (logementId) {
    revenusQuery = revenusQuery.eq("logement_id", logementId);
  }

  const { data: revenus, error: revenusError } = await revenusQuery;

  if (revenusError) throw new Error(revenusError.message);

  const revenusBrut = revenus?.reduce((sum, r) => sum + Number(r.montant_brut || 0), 0) ?? 0;
  const commissions = revenus?.reduce((sum, r) => sum + Number(r.montant_commission || 0), 0) ?? 0;
  const revenusNet = revenus?.reduce((sum, r) => sum + Number(r.montant_net || 0), 0) ?? 0;

  // Query charges (for now, use incidents cost as placeholder until factures_prestataires is implemented)
  let incidentsQuery = supabase
    .from("incidents")
    .select("cost")
    .eq("organisation_id", profile.organisation_id)
    .gte("opened_at", startDate.toISOString())
    .lte("opened_at", endDate.toISOString())
    .not("cost", "is", null);

  if (logementId) {
    incidentsQuery = incidentsQuery.eq("logement_id", logementId);
  }

  const { data: incidents, error: incidentsError } = await incidentsQuery;

  if (incidentsError) throw new Error(incidentsError.message);

  const charges = incidents?.reduce((sum, i) => sum + Number(i.cost || 0), 0) ?? 0;

  // Calculate margin (commissions - charges)
  const marge = commissions - charges;

  return {
    revenusBrut,
    commissions,
    revenusNet,
    charges,
    marge,
  };
}

/**
 * Get monthly revenue evolution
 */
export async function getMonthlyRevenues(startDate: Date, endDate: Date) {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("revenus_mensuels_global")
    .select("*")
    .eq("organisation_id", profile.organisation_id)
    .gte("mois", startDate.toISOString().split("T")[0])
    .lte("mois", endDate.toISOString().split("T")[0])
    .order("mois", { ascending: true });

  if (error) throw new Error(error.message);

  return data || [];
}

/**
 * Get revenues grouped by logement
 */
export async function getRevenusByLogement(startDate?: Date, endDate?: Date, logementId?: string) {
  const profile = await requireProfile();
  const supabase = createClient();

  let query = supabase
    .from("revenus")
    .select(`
      *,
      logement:logements(id, name, city),
      contrat:contrats(type, commission_rate)
    `)
    .eq("organisation_id", profile.organisation_id)
    .order("date_checkin", { ascending: false });

  if (logementId) {
    query = query.eq("logement_id", logementId);
  }
  if (startDate) {
    query = query.gte("date_checkin", startDate.toISOString().split("T")[0]);
  }
  if (endDate) {
    query = query.lte("date_checkin", endDate.toISOString().split("T")[0]);
  }

  const { data: revenus, error } = await query;

  if (error) throw new Error(error.message);

  // Group by logement
  const grouped = new Map<string, {
    logement_id: string;
    logement_name: string;
    logement_city: string | null;
    nb_reservations: number;
    total_brut: number;
    total_commissions: number;
    total_net: number;
    taux_moyen: number;
  }>();

  revenus?.forEach((r) => {
    const logement = Array.isArray(r.logement) ? r.logement[0] : r.logement;
    const logementId = r.logement_id;
    const logementName = logement?.name || "Logement inconnu";
    const logementCity = logement?.city || null;

    if (!grouped.has(logementId)) {
      grouped.set(logementId, {
        logement_id: logementId,
        logement_name: logementName,
        logement_city: logementCity,
        nb_reservations: 0,
        total_brut: 0,
        total_commissions: 0,
        total_net: 0,
        taux_moyen: 0,
      });
    }

    const entry = grouped.get(logementId)!;
    entry.nb_reservations += 1;
    entry.total_brut += Number(r.montant_brut || 0);
    entry.total_commissions += Number(r.montant_commission || 0);
    entry.total_net += Number(r.montant_net || 0);
  });

  // Calculate average commission rate
  const result = Array.from(grouped.values()).map((entry) => ({
    ...entry,
    taux_moyen: entry.total_brut > 0 ? (entry.total_commissions / entry.total_brut) * 100 : 0,
  }));

  // Sort by total_brut descending
  result.sort((a, b) => b.total_brut - a.total_brut);

  return result;
}

/**
 * Get all revenus (detailed list)
 */
export async function getAllRevenus(startDate?: Date, endDate?: Date, logementId?: string) {
  const profile = await requireProfile();
  const supabase = createClient();

  let query = supabase
    .from("revenus")
    .select(`
      *,
      logement:logements(id, name, city),
      reservation:reservations(guest_name, platform),
      contrat:contrats(type, proprietaire:proprietaires(full_name))
    `)
    .eq("organisation_id", profile.organisation_id)
    .order("date_checkin", { ascending: false });

  if (logementId) {
    query = query.eq("logement_id", logementId);
  }
  if (startDate) {
    query = query.gte("date_checkin", startDate.toISOString().split("T")[0]);
  }
  if (endDate) {
    query = query.lte("date_checkin", endDate.toISOString().split("T")[0]);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return data || [];
}
