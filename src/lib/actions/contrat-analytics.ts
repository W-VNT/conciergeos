"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export interface ContratAnalytics {
  activeCount: number;
  expiredCount: number;
  expiringSoonCount: number;
  averageCommissionRate: number;
  totalCAUnderContract: number;
}

export async function getContratAnalytics(
  organisationId?: string
): Promise<ContratAnalytics> {
  const profile = await requireProfile();
  // Always use caller's org — ignore parameter to prevent cross-org access
  const orgId = profile.organisation_id;
  const supabase = createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // 30 days from now
  const in30Days = new Date(today);
  in30Days.setDate(in30Days.getDate() + 30);
  const in30DaysStr = in30Days.toISOString().split("T")[0];

  // 12 months ago
  const twelveMonthsAgo = new Date(today);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const twelveMonthsAgoStr = twelveMonthsAgo.toISOString().split("T")[0];

  // Fetch all contrats for the organisation
  const { data: contrats, error } = await supabase
    .from("contrats")
    .select("id, status, end_date, commission_rate")
    .eq("organisation_id", orgId);

  if (error) throw new Error(error.message);

  const rows = contrats ?? [];

  // Active contracts
  const activeContracts = rows.filter((c) => c.status === "ACTIF");
  const activeCount = activeContracts.length;

  // Expired contracts in the last 12 months
  const expiredCount = rows.filter(
    (c) => c.status === "EXPIRE" && c.end_date >= twelveMonthsAgoStr
  ).length;

  // Contracts expiring within 30 days (active, end_date between today and +30 days)
  const expiringSoonCount = activeContracts.filter(
    (c) => c.end_date >= todayStr && c.end_date <= in30DaysStr
  ).length;

  // Average commission rate across active contracts
  const averageCommissionRate =
    activeCount > 0
      ? activeContracts.reduce((sum, c) => sum + Number(c.commission_rate), 0) / activeCount
      : 0;

  // Total CA (revenus bruts) under active contracts
  const activeContratIds = activeContracts.map((c) => c.id);
  let totalCAUnderContract = 0;

  if (activeContratIds.length > 0) {
    const { data: revenus, error: revError } = await supabase
      .from("revenus")
      .select("montant_brut")
      .eq("organisation_id", orgId)
      .in("contrat_id", activeContratIds);

    if (revError) throw new Error(revError.message);

    totalCAUnderContract = (revenus ?? []).reduce(
      (sum, r) => sum + Number(r.montant_brut || 0),
      0
    );
  }

  return {
    activeCount,
    expiredCount,
    expiringSoonCount,
    averageCommissionRate,
    totalCAUnderContract,
  };
}
