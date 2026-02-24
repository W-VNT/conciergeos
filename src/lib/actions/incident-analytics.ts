"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export interface IncidentByLogement {
  logement_id: string;
  logement_name: string;
  count: number;
}

export interface IncidentByCategory {
  category: string;
  label: string;
  count: number;
}

export interface IncidentMonthlyTrend {
  month: string; // YYYY-MM
  label: string; // e.g. "janvier 2026"
  count: number;
  trend: "up" | "down" | "stable";
}

export interface IncidentCostSummary {
  totalCost: number;
  averageCost: number;
  paidCount: number;
}

export interface IncidentAnalytics {
  byLogement: IncidentByLogement[];
  byCategory: IncidentByCategory[];
  monthlyTrends: IncidentMonthlyTrend[];
  costSummary: IncidentCostSummary;
}

const CATEGORY_LABELS: Record<string, string> = {
  PLOMBERIE: "Plomberie",
  ELECTRICITE: "Électricité",
  SERRURERIE: "Serrurerie",
  NUISIBLES: "Nuisibles",
  MENAGE: "Ménage",
  BRUIT: "Bruit / Voisinage",
  EQUIPEMENT: "Équipement",
  AUTRE: "Autre",
};

const MONTH_NAMES = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export async function getIncidentAnalytics(
  startDate: Date,
  endDate: Date,
  organisationId?: string
): Promise<IncidentAnalytics> {
  const profile = await requireProfile();
  const orgId = organisationId ?? profile.organisation_id;
  const supabase = createClient();

  // Fetch all incidents in range with logement name
  const { data: incidents, error } = await supabase
    .from("incidents")
    .select("id, logement_id, category, cost, opened_at, logement:logements(name)")
    .eq("organisation_id", orgId)
    .gte("opened_at", startDate.toISOString())
    .lte("opened_at", endDate.toISOString());

  if (error) throw new Error(error.message);

  const rows = incidents ?? [];

  // ── By logement ──────────────────────────────────────────────────────
  const logementMap = new Map<string, { name: string; count: number }>();
  for (const r of rows) {
    const rawLogement = r.logement;
    const logement = (Array.isArray(rawLogement) ? rawLogement[0] : rawLogement) as { name: string } | null;
    const name = logement?.name ?? "Logement inconnu";
    const entry = logementMap.get(r.logement_id) ?? { name, count: 0 };
    entry.count++;
    logementMap.set(r.logement_id, entry);
  }
  const byLogement: IncidentByLogement[] = Array.from(logementMap.entries())
    .map(([logement_id, { name, count }]) => ({ logement_id, logement_name: name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ── By category ──────────────────────────────────────────────────────
  const categoryMap = new Map<string, number>();
  for (const r of rows) {
    const cat = r.category ?? "AUTRE";
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
  }
  const byCategory: IncidentByCategory[] = Array.from(categoryMap.entries())
    .map(([category, count]) => ({
      category,
      label: CATEGORY_LABELS[category] ?? category,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Monthly trends (last 6 months from endDate) ──────────────────────
  const monthMap = new Map<string, number>();
  for (const r of rows) {
    const d = new Date(r.opened_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  }

  // Generate last 6 months keys
  const monthKeys: string[] = [];
  const cursor = new Date(endDate);
  for (let i = 0; i < 6; i++) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    monthKeys.unshift(key);
    cursor.setMonth(cursor.getMonth() - 1);
  }

  const monthlyTrends: IncidentMonthlyTrend[] = monthKeys.map((key, idx) => {
    const [yearStr, monthStr] = key.split("-");
    const monthIndex = parseInt(monthStr, 10) - 1;
    const count = monthMap.get(key) ?? 0;
    const prevCount = idx > 0 ? (monthMap.get(monthKeys[idx - 1]) ?? 0) : count;
    const trend: "up" | "down" | "stable" =
      idx === 0 ? "stable" : count > prevCount ? "up" : count < prevCount ? "down" : "stable";

    return {
      month: key,
      label: `${MONTH_NAMES[monthIndex]} ${yearStr}`,
      count,
      trend,
    };
  });

  // ── Cost summary ─────────────────────────────────────────────────────
  const withCost = rows.filter((r) => r.cost != null && Number(r.cost) > 0);
  const totalCost = withCost.reduce((sum, r) => sum + Number(r.cost), 0);
  const averageCost = withCost.length > 0 ? totalCost / withCost.length : 0;

  const costSummary: IncidentCostSummary = {
    totalCost,
    averageCost,
    paidCount: withCost.length,
  };

  return { byLogement, byCategory, monthlyTrends, costSummary };
}
