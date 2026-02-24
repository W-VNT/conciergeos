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
import { getOperatorStats } from "@/lib/actions/operator-stats";

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

  return (
    <div>
      <PageHeader title="Missions" createHref="/missions/new" createLabel="Nouvelle mission" />
      {admin && operatorStats.length > 0 && (
        <OperatorStatsSection stats={operatorStats} />
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
        missions={missions}
        organisationId={profile.organisation_id}
      />
      <Pagination totalCount={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
