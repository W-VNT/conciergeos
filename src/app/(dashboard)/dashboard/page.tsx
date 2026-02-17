import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MISSION_STATUS_LABELS, MISSION_TYPE_LABELS, INCIDENT_SEVERITY_LABELS, INCIDENT_STATUS_LABELS } from "@/types/database";
import { ClipboardList, AlertTriangle, FileText } from "lucide-react";
import Link from "next/link";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";

// Revalidate every 30 seconds (ISR cache)
export const revalidate = 30;

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  // Parallelize essential queries only
  const [
    { data: upcomingMissions },
    { data: openIncidents, count: openIncidentsCount },
    { count: criticalCount },
    { count: expiringContractsCount },
  ] = await Promise.all([
    // Today's and tomorrow's missions
    (async () => {
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      let query = supabase
        .from("missions")
        .select("*, logement:logements(name), assignee:profiles(full_name)")
        .gte("scheduled_at", today.toISOString())
        .lt("scheduled_at", dayAfterTomorrow.toISOString())
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

    // Contracts expiring in next 7 days
    supabase
      .from("contrats")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIF")
      .gte("end_date", today.toISOString())
      .lte("end_date", sevenDaysFromNow.toISOString()),
  ]);

  // Filter today's missions for the card
  const todayMissions = upcomingMissions?.filter(m => {
    const missionDate = new Date(m.scheduled_at);
    return missionDate >= today && missionDate < tomorrow;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Single grid — calendar spans both rows */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-4 lg:grid-rows-[auto_1fr]">

        {/* Calendar Widget — spans 2 rows */}
        <div className="lg:row-span-2 min-h-[200px]">
          <CalendarWidget missions={upcomingMissions || []} />
        </div>

        {/* KPI row */}
        <div className="lg:col-span-3 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            title="Missions du jour"
            value={todayMissions?.length ?? 0}
            icon={ClipboardList}
            href="/missions"
          />
          <KpiCard
            title="Incidents ouverts"
            value={openIncidentsCount ?? 0}
            description={`dont ${criticalCount ?? 0} critique(s)`}
            icon={AlertTriangle}
            href="/incidents"
          />
          <KpiCard
            title="Contrats expirant (7j)"
            value={expiringContractsCount ?? 0}
            description={expiringContractsCount && expiringContractsCount > 0 ? "À renouveler" : "Aucun"}
            icon={FileText}
            href="/contrats"
          />
        </div>

        {/* Content row — même ligne que le calendrier */}
        <div className="lg:col-span-3 grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card className="flex flex-col h-full">
            <CardHeader><CardTitle className="text-lg">Missions du jour</CardTitle></CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
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

          <Card className="flex flex-col h-full">
            <CardHeader><CardTitle className="text-lg">Incidents ouverts</CardTitle></CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
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
        </div>

      </div>
    </div>
  );
}
