import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusFilter } from "@/components/shared/status-filter";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { MISSION_STATUS_LABELS, MISSION_TYPE_LABELS } from "@/types/database";
import { MissionsTableWithSelection } from "@/components/missions/missions-table-with-selection";
import { ClipboardList } from "lucide-react";

const PAGE_SIZE = 20;

// Revalidate every 30 seconds
export const revalidate = 30;

export default async function MissionsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; type?: string; page?: string };
}) {
  const profile = await requireProfile();
  const supabase = createClient();
  const page = Number(searchParams.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("missions")
    .select("*, logement:logements(name, code_postal), assignee:profiles(full_name)", { count: "exact" })
    .order("scheduled_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (searchParams.q) query = query.ilike("notes", `%${searchParams.q}%`);
  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.type) query = query.eq("type", searchParams.type);

  const { data, count } = await query;
  const rawMissions = data || [];

  // Normalize joined data (Supabase can return arrays instead of objects for joins)
  const missions = rawMissions.map(mission => ({
    ...mission,
    logement: Array.isArray(mission.logement) ? mission.logement[0] : mission.logement,
    assignee: Array.isArray(mission.assignee) ? mission.assignee[0] : mission.assignee,
  }));

  const statusOptions = Object.entries(MISSION_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const typeOptions = Object.entries(MISSION_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }));

  return (
    <div>
      <PageHeader title="Missions" createHref="/missions/new" createLabel="Nouvelle mission" />
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput placeholder="Rechercher dans les notes..." />
        <StatusFilter options={statusOptions} placeholder="Tous les statuts" />
        <StatusFilter paramName="type" options={typeOptions} placeholder="Tous les types" />
      </div>
      {missions.length === 0 ? (
        <div className="rounded-lg border bg-card">
          <EmptyState
            icon={ClipboardList}
            title="Aucune mission trouvée"
            description="Les missions apparaîtront ici"
          />
        </div>
      ) : (
        <MissionsTableWithSelection
          missions={missions}
          organisationId={profile.organisation_id}
        />
      )}
      <Pagination totalCount={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
