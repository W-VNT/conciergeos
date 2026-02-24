import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusFilter } from "@/components/shared/status-filter";
import { ChipFilter } from "@/components/shared/chip-filter";
import { Pagination } from "@/components/shared/pagination";
import { MISSION_STATUS_LABELS, MISSION_TYPE_LABELS } from "@/types/database";
import { MissionsTableWithSelection } from "@/components/missions/missions-table-with-selection";
import { OperatorStatsSection } from "@/components/missions/operator-stats-section";
import { RecurrencesSection } from "@/components/missions/recurrences-section";
import { SlaConfigSection } from "@/components/missions/sla-config-section";
import { getOperatorStats } from "@/lib/actions/operator-stats";
import { checkMissionSla } from "@/lib/actions/sla";
import type { SlaConfig, MissionRecurrence } from "@/types/database";

export const metadata = { title: "Missions" };

const PAGE_SIZE = 20;

export const dynamic = "force-dynamic";

export default async function MissionsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; type?: string; assigned_to?: string; page?: string };
}) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();
  const page = Number(searchParams.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;

  // Fetch operators (OPERATEUR + ADMIN) for the assignee filter
  const { data: operators } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organisation_id", profile.organisation_id)
    .in("role", ["OPERATEUR", "ADMIN"])
    .order("full_name");

  const operatorOptions = (operators || []).map((op) => ({
    value: op.id,
    label: op.full_name,
  }));

  let query = supabase
    .from("missions")
    .select("*, logement:logements(name), assignee:profiles(full_name)", { count: "exact" })
    .eq("organisation_id", profile.organisation_id)
    .order("scheduled_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (searchParams.q) {
    const sanitized = searchParams.q.replace(/%/g, '\\%').replace(/_/g, '\\_');
    query = query.ilike("notes", `%${sanitized}%`);
  }
  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.type) query = query.eq("type", searchParams.type);
  if (searchParams.assigned_to) query = query.eq("assigned_to", searchParams.assigned_to);

  const { data, count } = await query;
  const missions = data || [];

  const statusOptions = Object.entries(MISSION_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const typeOptions = Object.entries(MISSION_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }));

  // Fetch operator stats for admins
  const operatorStats = admin ? await getOperatorStats(profile.organisation_id) : [];

  // Fetch recurrences, logements, and SLA configs for admins
  const [
    { data: recurrences },
    { data: logements },
    { data: slaConfigs },
  ] = admin
    ? await Promise.all([
        supabase
          .from("mission_recurrences")
          .select("*, logement:logements(name), assignee:profiles(full_name)")
          .eq("organisation_id", profile.organisation_id)
          .order("created_at", { ascending: false }),
        supabase
          .from("logements")
          .select("id, name")
          .eq("organisation_id", profile.organisation_id)
          .eq("status", "ACTIF")
          .order("name"),
        supabase
          .from("sla_configs")
          .select("*")
          .eq("organisation_id", profile.organisation_id),
      ])
    : [{ data: null }, { data: null }, { data: null }];

  // Compute SLA overdue status for each mission
  const missionSlaConfigs = ((slaConfigs ?? []) as SlaConfig[]).filter(
    (c) => c.entity_type === "MISSION"
  );
  const missionsWithSla = await Promise.all(
    missions.map(async (m) => ({
      ...m,
      _slaOverdue: (await checkMissionSla(
        { type: m.type, status: m.status, scheduled_at: m.scheduled_at, completed_at: m.completed_at },
        missionSlaConfigs
      )).isOverdue,
    }))
  );

  return (
    <div>
      <PageHeader title="Missions" createHref="/missions/new" createLabel="Nouvelle mission" />
      {admin && operatorStats.length > 0 && (
        <OperatorStatsSection stats={operatorStats} />
      )}
      {admin && (
        <RecurrencesSection
          initialRecurrences={(recurrences ?? []) as MissionRecurrence[]}
          logements={(logements ?? []) as Array<{ id: string; name: string }>}
          operators={(operators ?? []).map((op) => ({ id: op.id, full_name: op.full_name }))}
        />
      )}
      {admin && (
        <SlaConfigSection initialConfigs={(slaConfigs ?? []) as SlaConfig[]} />
      )}
      {/* Filtres mobile : chips scrollables */}
      <div className="md:hidden space-y-2 mb-4">
        <SearchInput placeholder="Rechercher dans les notes..." />
        <ChipFilter options={statusOptions} placeholder="Tous les statuts" />
        <ChipFilter paramName="type" options={typeOptions} placeholder="Tous les types" />
        <ChipFilter paramName="assigned_to" options={operatorOptions} placeholder="Tous les opérateurs" />
      </div>
      {/* Filtres desktop : dropdowns */}
      <div className="hidden md:flex flex-row gap-3 mb-4">
        <SearchInput placeholder="Rechercher dans les notes..." />
        <StatusFilter options={statusOptions} placeholder="Tous les statuts" />
        <StatusFilter paramName="type" options={typeOptions} placeholder="Tous les types" />
        <StatusFilter paramName="assigned_to" options={operatorOptions} placeholder="Tous les opérateurs" />
      </div>
      <MissionsTableWithSelection
        missions={missionsWithSla}
        organisationId={profile.organisation_id}
      />
      <Pagination totalCount={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
