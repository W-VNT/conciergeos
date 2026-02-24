import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusFilter } from "@/components/shared/status-filter";
import { ChipFilter } from "@/components/shared/chip-filter";
import { Pagination } from "@/components/shared/pagination";
import { INCIDENT_STATUS_LABELS, INCIDENT_SEVERITY_LABELS, INCIDENT_CATEGORY_LABELS } from "@/types/database";
import { IncidentsTableWithSelection } from "@/components/incidents/incidents-table-with-selection";
import { MaintenanceDashboard } from "@/components/incidents/maintenance-dashboard";
import { SlaConfigSection } from "@/components/incidents/sla-config-section";
import { getIncidentAnalytics } from "@/lib/actions/incident-analytics";
import { getSlaConfigs } from "@/lib/actions/sla";

export const metadata = { title: "Incidents" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function IncidentsPage({ searchParams }: { searchParams: { q?: string; status?: string; severity?: string; category?: string; page?: string } }) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();
  const page = Number(searchParams.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;

  // Date range for analytics: last 6 months
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);

  let query = supabase.from("incidents").select("*, logement:logements(name), prestataire:prestataires(full_name)", { count: "exact" }).eq("organisation_id", profile.organisation_id).order("opened_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
  if (searchParams.q) {
    const sanitized = searchParams.q.replace(/%/g, '\\%').replace(/_/g, '\\_');
    query = query.ilike("description", `%${sanitized}%`);
  }
  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.severity) query = query.eq("severity", searchParams.severity);
  if (searchParams.category) query = query.eq("category", searchParams.category);

  // Fetch incidents, analytics, and SLA configs in parallel
  const [{ data, count }, analytics, slaResult] = await Promise.all([
    query,
    admin
      ? getIncidentAnalytics(startDate, endDate, profile.organisation_id)
      : Promise.resolve(null),
    getSlaConfigs(profile.organisation_id),
  ]);

  const slaConfigs = slaResult.success && slaResult.data ? slaResult.data : [];
  const incidentSlaConfigs = slaConfigs
    .filter((c) => c.entity_type === "INCIDENT")
    .map((c) => ({ subtype: c.subtype, max_hours: c.max_hours }));

  const statusOptions = Object.entries(INCIDENT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const severityOptions = Object.entries(INCIDENT_SEVERITY_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const categoryOptions = Object.entries(INCIDENT_CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }));

  return (
    <div>
      <PageHeader title="Incidents" createHref="/incidents/new" createLabel="Nouvel incident" />

      {/* Tableau de bord maintenance (admin uniquement) */}
      {admin && analytics && (
        <MaintenanceDashboard
          byLogement={analytics.byLogement}
          byCategory={analytics.byCategory}
          monthlyTrends={analytics.monthlyTrends}
          costSummary={analytics.costSummary}
        />
      )}

      {/* Filtres mobile : chips scrollables */}
      <div className="md:hidden space-y-2 mb-4">
        <SearchInput placeholder="Rechercher dans description..." />
        <ChipFilter options={statusOptions} placeholder="Tous les statuts" />
        <ChipFilter paramName="severity" options={severityOptions} placeholder="Toutes les sévérités" />
        <ChipFilter paramName="category" options={categoryOptions} placeholder="Toutes les catégories" />
      </div>
      {/* Filtres desktop : dropdowns */}
      <div className="hidden md:flex flex-row gap-3 mb-4">
        <SearchInput placeholder="Rechercher dans description..." />
        <StatusFilter options={statusOptions} placeholder="Tous les statuts" />
        <StatusFilter paramName="severity" options={severityOptions} placeholder="Toutes les sévérités" />
        <StatusFilter paramName="category" options={categoryOptions} placeholder="Toutes les catégories" />
      </div>
      <IncidentsTableWithSelection
        incidents={data || []}
        organisationId={profile.organisation_id}
        slaConfigs={incidentSlaConfigs}
      />
      <Pagination totalCount={count ?? 0} pageSize={PAGE_SIZE} />

      {admin && (
        <div className="mt-8">
          <SlaConfigSection slaConfigs={slaConfigs} />
        </div>
      )}
    </div>
  );
}
