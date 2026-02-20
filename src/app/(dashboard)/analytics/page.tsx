import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, DollarSign, Percent, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import { DateFilter, type DateRange } from "@/components/dashboard/date-filter";
import Link from "next/link";

// Revalidate every 60 seconds
export const revalidate = 60;

interface AnalyticsPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  await requireProfile();
  const supabase = createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate date range based on filter
  const range = (searchParams.range as DateRange) || "30d";
  let startDate: Date;
  let endDate: Date = new Date(today);
  endDate.setHours(23, 59, 59, 999);

  if (range === "custom" && searchParams.start && searchParams.end) {
    startDate = new Date(searchParams.start as string);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(searchParams.end as string);
    endDate.setHours(23, 59, 59, 999);
  } else if (range === "7d") {
    startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 7);
  } else if (range === "90d") {
    startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 90);
  } else {
    // Default: 30d
    startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 30);
  }

  // Parallelize analytics queries
  const [
    { data: resolvedIncidents },
    { data: costData },
    { data: allIncidents },
    { data: logements },
    { data: reservations },
  ] = await Promise.all([
    // Resolved incidents for avg calculation
    supabase
      .from("incidents")
      .select("opened_at, resolved_at")
      .not("resolved_at", "is", null)
      .gte("resolved_at", startDate.toISOString())
      .lte("resolved_at", endDate.toISOString()),

    // Cost data
    supabase
      .from("incidents")
      .select("cost")
      .not("cost", "is", null)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString()),

    // All incidents for top logements calculation
    supabase
      .from("incidents")
      .select("logement_id, logement:logements(id, name)")
      .not("logement_id", "is", null)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString()),

    // All logements for occupation calculation
    supabase
      .from("logements")
      .select("id, name")
      .eq("status", "ACTIF"),

    // Reservations for the selected date range
    supabase
      .from("reservations")
      .select("check_in_date, check_out_date, amount, status")
      .eq("status", "CONFIRMEE")
      .gte("check_out_date", startDate.toISOString())
      .lte("check_in_date", endDate.toISOString()),
  ]);

  // Calculate average resolution time
  let avgResolutionHours = 0;
  if (resolvedIncidents && resolvedIncidents.length > 0) {
    const totalMs = resolvedIncidents.reduce((sum, inc) => {
      return sum + (new Date(inc.resolved_at!).getTime() - new Date(inc.opened_at).getTime());
    }, 0);
    avgResolutionHours = Math.round(totalMs / resolvedIncidents.length / (1000 * 60 * 60));
  }

  const totalCost = costData?.reduce((sum, i) => sum + (Number(i.cost) || 0), 0) ?? 0;

  // Calculate top 5 logements by incident count
  const logementIncidentMap = new Map<string, { logement: { id: string; name: string }; count: number }>();
  allIncidents?.forEach((incident) => {
    const logementId = incident.logement_id;
    const logementData = incident.logement;
    const logement = Array.isArray(logementData) ? logementData[0] : logementData;
    if (logementId && logement) {
      const existing = logementIncidentMap.get(logementId);
      if (existing) {
        existing.count++;
      } else {
        logementIncidentMap.set(logementId, { logement: { id: logement.id, name: logement.name }, count: 1 });
      }
    }
  });

  const topLogements = Array.from(logementIncidentMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate occupation rate for selected date range
  const daysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalAvailableDays = (logements?.length ?? 0) * daysInRange;

  let occupiedDays = 0;
  reservations?.forEach((reservation) => {
    const checkIn = new Date(reservation.check_in_date);
    const checkOut = new Date(reservation.check_out_date);

    // Clamp dates to selected date range boundaries
    const effectiveCheckIn = checkIn < startDate ? startDate : checkIn;
    const effectiveCheckOut = checkOut > endDate ? new Date(endDate.getTime() + 86400000) : checkOut;

    // Calculate nights in the date range
    const nights = Math.ceil((effectiveCheckOut.getTime() - effectiveCheckIn.getTime()) / (1000 * 60 * 60 * 24));
    occupiedDays += Math.max(0, nights);
  });

  const occupationRate = totalAvailableDays > 0 ? Math.round((occupiedDays / totalAvailableDays) * 100) : 0;

  // Calculate revenue for selected date range
  const totalRevenue = reservations?.reduce((sum, r) => sum + (Number(r.amount) || 0), 0) ?? 0;

  // Format range label for display
  const rangeLabel = range === "7d" ? "7 derniers jours" : range === "90d" ? "90 derniers jours" : range === "custom" ? "Période personnalisée" : "30 derniers jours";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">{rangeLabel}</p>
        </div>
        <DateFilter />
      </div>

      {/* Advanced KPIs */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Résolution moyenne"
          value={`${avgResolutionHours}h`}
          description={`${resolvedIncidents?.length ?? 0} incident(s) résolu(s)`}
          icon={Clock}
        />
        <KpiCard
          title="Coût incidents"
          value={`${totalCost.toFixed(0)}€`}
          description={`${costData?.length ?? 0} incident(s) facturé(s)`}
          icon={DollarSign}
        />
        <KpiCard
          title="Taux d'occupation"
          value={`${occupationRate}%`}
          description={`${occupiedDays}/${totalAvailableDays} jours`}
          icon={Percent}
        />
        <KpiCard
          title="Revenus"
          value={`${totalRevenue.toFixed(0)}€`}
          description={`${reservations?.length ?? 0} réservation(s)`}
          icon={TrendingUp}
        />
      </div>

      {/* Additional Analytics */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Top Logements by Incidents */}
        {topLogements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Top 5 Logements - Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topLogements.map((item, index) => (
                  <Link
                    key={item.logement.id}
                    href={`/logements/${item.logement.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                        index === 0 ? "bg-red-100 text-red-600" :
                        index === 1 ? "bg-orange-100 text-orange-600" :
                        "bg-yellow-100 text-yellow-600"
                      }`}>
                        {item.count}
                      </div>
                      <span className="text-sm font-medium">{item.logement.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.count} incident{item.count > 1 ? "s" : ""}
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Résumé de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <span className="text-sm text-muted-foreground">Incidents résolus</span>
                <span className="text-lg font-semibold">{resolvedIncidents?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <span className="text-sm text-muted-foreground">Logements actifs</span>
                <span className="text-lg font-semibold">{logements?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <span className="text-sm text-muted-foreground">Réservations confirmées</span>
                <span className="text-lg font-semibold">{reservations?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <span className="text-sm text-muted-foreground">Coût moyen / incident</span>
                <span className="text-lg font-semibold">
                  {costData && costData.length > 0 ? `${(totalCost / costData.length).toFixed(0)}€` : "0€"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
