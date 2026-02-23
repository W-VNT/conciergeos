import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusFilter } from "@/components/shared/status-filter";
import { ChipFilter } from "@/components/shared/chip-filter";
import { Pagination } from "@/components/shared/pagination";
import { INCIDENT_STATUS_LABELS, INCIDENT_SEVERITY_LABELS } from "@/types/database";
import { IncidentsTableWithSelection } from "@/components/incidents/incidents-table-with-selection";

export const metadata = { title: "Incidents" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function IncidentsPage({ searchParams }: { searchParams: { q?: string; status?: string; severity?: string; page?: string } }) {
  const profile = await requireProfile();
  const supabase = createClient();
  const page = Number(searchParams.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase.from("incidents").select("*, logement:logements(name), prestataire:prestataires(full_name)", { count: "exact" }).eq("organisation_id", profile.organisation_id).order("opened_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
  if (searchParams.q) {
    const sanitized = searchParams.q.replace(/%/g, '\\%').replace(/_/g, '\\_');
    query = query.ilike("description", `%${sanitized}%`);
  }
  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.severity) query = query.eq("severity", searchParams.severity);
  const { data, count } = await query;

  const statusOptions = Object.entries(INCIDENT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const severityOptions = Object.entries(INCIDENT_SEVERITY_LABELS).map(([v, l]) => ({ value: v, label: l }));

  return (
    <div>
      <PageHeader title="Incidents" createHref="/incidents/new" createLabel="Nouvel incident" />
      {/* Filtres mobile : chips scrollables */}
      <div className="md:hidden space-y-2 mb-4">
        <SearchInput placeholder="Rechercher dans description..." />
        <ChipFilter options={statusOptions} placeholder="Tous les statuts" />
        <ChipFilter paramName="severity" options={severityOptions} placeholder="Toutes les sévérités" />
      </div>
      {/* Filtres desktop : dropdowns */}
      <div className="hidden md:flex flex-row gap-3 mb-4">
        <SearchInput placeholder="Rechercher dans description..." />
        <StatusFilter options={statusOptions} placeholder="Tous les statuts" />
        <StatusFilter paramName="severity" options={severityOptions} placeholder="Toutes les sévérités" />
      </div>
      <IncidentsTableWithSelection
        incidents={data || []}
        organisationId={profile.organisation_id}
      />
      <Pagination totalCount={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
