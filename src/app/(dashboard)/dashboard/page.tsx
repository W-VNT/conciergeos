import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MISSION_STATUS_LABELS, MISSION_TYPE_LABELS, INCIDENT_SEVERITY_LABELS, INCIDENT_STATUS_LABELS, CONTRACT_TYPE_LABELS } from "@/types/database";
import { ClipboardList, AlertTriangle, Clock, DollarSign, FileText, AlertCircle, Percent, TrendingUp } from "lucide-react";
import Link from "next/link";
import { DateFilter, type DateRange } from "@/components/dashboard/date-filter";

// Revalidate every 30 seconds (ISR cache)
export const revalidate = 30;

interface DashboardPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const profile = await requireProfile();
  const supabase = createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

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

  // Parallelize all queries with Promise.all for faster loading
  const [
    { data: todayMissions },
    { data: openIncidents, count: openIncidentsCount },
    { count: criticalCount },
    { data: resolvedIncidents },
    { data: costData },
    { data: expiringContracts },
    { data: allIncidents },
    { data: logements },
    { data: currentMonthReservations },
  ] = await Promise.all([
    // Today's missions
    (async () => {
      let query = supabase
        .from("missions")
        .select("*, logement:logements(name), assignee:profiles(full_name)")
        .gte("scheduled_at", today.toISOString())
        .lt("scheduled_at", tomorrow.toISOString())
        .order("scheduled_at");

      if (!isAdmin(profile)) {
        query = query.eq("assigned_to", profile.id);
      }
      return query;
    })(),

    // Open incidents with count
    supabase
      .from("incidents")
      .select("*, logement:logements(name)", { count: "exact" })
      .in("status", ["OUVERT", "EN_COURS"])
      .order("opened_at", { ascending: false })
      .limit(10),

    // Critical incidents count
    supabase
      .from("incidents")
      .select("*", { count: "exact", head: true })
      .in("status", ["OUVERT", "EN_COURS"])
      .eq("severity", "CRITIQUE"),

    // Resolved incidents for avg calculation
    supabase
      .from("incidents")
      .select("opened_at, resolved_at")
      .not("resolved_at", "is", null)
      .gte("resolved_at", startDate.toISOString()),

    // Cost data
    supabase
      .from("incidents")
      .select("cost")
      .not("cost", "is", null)
      .gte("created_at", startDate.toISOString()),

    // Expiring contracts (ending in next 30 days)
    supabase
      .from("contrats")
      .select("*, proprietaire:proprietaires(full_name)")
      .eq("status", "ACTIF")
      .gte("end_date", today.toISOString())
      .lte("end_date", thirtyDaysFromNow.toISOString())
      .order("end_date"),

    // All incidents for top logements calculation
    supabase
      .from("incidents")
      .select("logement_id, logement:logements(id, name)")
      .not("logement_id", "is", null),

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
    // Handle both single object and array responses from Supabase
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
  currentMonthReservations?.forEach((reservation) => {
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
  const currentMonthRevenue = currentMonthReservations?.reduce((sum, r) => sum + (Number(r.amount) || 0), 0) ?? 0;

  // Format range label for display
  const rangeLabel = range === "7d" ? "7j" : range === "90d" ? "90j" : range === "custom" ? "période" : "30j";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <DateFilter />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard title="Missions du jour" value={todayMissions?.length ?? 0} icon={ClipboardList} />
        <KpiCard title="Incidents ouverts" value={openIncidentsCount ?? 0} description={`dont ${criticalCount ?? 0} critique(s)`} icon={AlertTriangle} />
        <KpiCard title={`Résolution moy. (${rangeLabel})`} value={`${avgResolutionHours}h`} icon={Clock} />
        <KpiCard title={`Coût incidents (${rangeLabel})`} value={`${totalCost.toFixed(0)}€`} icon={DollarSign} />
        <KpiCard
          title="Taux d'occupation"
          value={`${occupationRate}%`}
          description={`${occupiedDays}/${totalAvailableDays} jours`}
          icon={Percent}
        />
        <KpiCard
          title="Revenus"
          value={`${currentMonthRevenue.toFixed(0)}€`}
          description={rangeLabel}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Missions du jour</CardTitle></CardHeader>
          <CardContent>
            {!todayMissions || todayMissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune mission aujourd&apos;hui</p>
            ) : (
              <div className="space-y-3">
                {todayMissions.map((m) => (
                  <Link key={m.id} href={`/missions/${m.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge value={m.type} label={MISSION_TYPE_LABELS[m.type as keyof typeof MISSION_TYPE_LABELS]} />
                        <span className="text-sm font-medium">{(m.logement as { name: string } | null)?.name}</span>
                      </div>
                      {(m.assignee as { full_name: string } | null) && (
                        <p className="text-xs text-muted-foreground">{(m.assignee as { full_name: string }).full_name}</p>
                      )}
                    </div>
                    <StatusBadge value={m.status} label={MISSION_STATUS_LABELS[m.status as keyof typeof MISSION_STATUS_LABELS]} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Incidents ouverts</CardTitle></CardHeader>
          <CardContent>
            {!openIncidents || openIncidents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun incident ouvert</p>
            ) : (
              <div className="space-y-3">
                {openIncidents.map((i) => (
                  <Link key={i.id} href={`/incidents/${i.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge value={i.severity} label={INCIDENT_SEVERITY_LABELS[i.severity as keyof typeof INCIDENT_SEVERITY_LABELS]} />
                        <span className="text-sm">{(i.description as string)?.slice(0, 50)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{(i.logement as { name: string } | null)?.name}</p>
                    </div>
                    <StatusBadge value={i.status} label={INCIDENT_STATUS_LABELS[i.status as keyof typeof INCIDENT_STATUS_LABELS]} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {expiringContracts && expiringContracts.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Contrats expirant bientôt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expiringContracts.map((c) => {
                  const endDate = new Date(c.end_date);
                  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const isUrgent = daysRemaining <= 7;

                  return (
                    <Link
                      key={c.id}
                      href={`/contrats/${c.id}`}
                      className={`flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors ${
                        isUrgent ? "border-orange-500 bg-orange-50" : ""
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {(c.proprietaire as { full_name: string } | null)?.full_name ?? "Sans propriétaire"}
                          </span>
                          <StatusBadge
                            value={c.type}
                            label={CONTRACT_TYPE_LABELS[c.type as keyof typeof CONTRACT_TYPE_LABELS]}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Expire le {endDate.toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${isUrgent ? "text-orange-600" : "text-muted-foreground"}`}>
                          {daysRemaining} jour{daysRemaining > 1 ? "s" : ""} restant{daysRemaining > 1 ? "s" : ""}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {topLogements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Top 5 logements - Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topLogements.map((item) => (
                  <Link
                    key={item.logement.id}
                    href={`/logements/${item.logement.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-semibold text-sm">
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
      </div>
    </div>
  );
}
