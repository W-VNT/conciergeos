import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusFilter } from "@/components/shared/status-filter";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard } from "@/components/shared/kpi-card";
import { CONTRACT_STATUS_LABELS, CONTRACT_TYPE_LABELS } from "@/types/database";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, FileText, CheckCircle, Clock, Percent, DollarSign } from "lucide-react";
import Link from "next/link";
import { ExportCSVButton } from "@/components/shared/export-csv-button";
import { getContratAnalytics } from "@/lib/actions/contrat-analytics";
import { formatCurrency } from "@/lib/format-currency";

export const metadata = { title: "Contrats" };

const PAGE_SIZE = 20;

export const dynamic = "force-dynamic";

export default async function ContratsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; type?: string; proprietaire_id?: string; page?: string };
}) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();
  const page = Number(searchParams.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;

  // ── CO5: Advanced search — search by proprietaire name, logement name, and conditions ──
  let searchFilter: string | null = null;

  if (searchParams.q) {
    const safeQ = searchParams.q.replace(/%/g, "\\%").replace(/_/g, "\\_");

    // Step 1: Find proprietaire IDs matching the search
    const { data: matchingProps } = await supabase
      .from("proprietaires")
      .select("id")
      .eq("organisation_id", profile.organisation_id)
      .ilike("full_name", `%${safeQ}%`);

    // Step 2: Find logement IDs matching the search
    const { data: matchingLogements } = await supabase
      .from("logements")
      .select("id")
      .eq("organisation_id", profile.organisation_id)
      .ilike("name", `%${safeQ}%`);

    const propIds = (matchingProps ?? []).map((p) => p.id);
    const logIds = (matchingLogements ?? []).map((l) => l.id);

    // Build OR filter parts
    const orParts: string[] = [];
    if (propIds.length > 0) {
      orParts.push(`proprietaire_id.in.(${propIds.join(",")})`);
    }
    if (logIds.length > 0) {
      orParts.push(`logement_id.in.(${logIds.join(",")})`);
    }
    orParts.push(`conditions.ilike.%${safeQ}%`);

    searchFilter = orParts.join(",");
  }

  let query = supabase
    .from("contrats")
    .select("*, proprietaire:proprietaires(full_name), logement:logements(name)", { count: "exact" })
    .eq("organisation_id", profile.organisation_id)
    .order("start_date", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (searchFilter) {
    query = query.or(searchFilter);
  }
  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.type) query = query.eq("type", searchParams.type);
  if (searchParams.proprietaire_id) query = query.eq("proprietaire_id", searchParams.proprietaire_id);

  // Fetch contrats, proprietaires list, and analytics in parallel
  const [{ data, count }, { data: proprietaires }, analytics] = await Promise.all([
    query,
    supabase.from("proprietaires").select("id, full_name").eq("organisation_id", profile.organisation_id).order("full_name"),
    admin ? getContratAnalytics(profile.organisation_id) : Promise.resolve(null),
  ]);

  const statusOptions = Object.entries(CONTRACT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const typeOptions = Object.entries(CONTRACT_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const proprietaireOptions = (proprietaires ?? []).map((p) => ({ value: p.id, label: p.full_name }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      <PageHeader
        title="Contrats"
        createHref="/contrats/new"
        createLabel="Nouveau contrat"
        showCreate={admin}
      />

      {/* CO10: KPI cards (admin only) */}
      {admin && analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="Contrats actifs"
            value={analytics.activeCount}
            icon={CheckCircle}
          />
          <KpiCard
            title="Expirent bientôt"
            value={analytics.expiringSoonCount}
            description={analytics.expiringSoonCount > 0 ? "Dans les 30 prochains jours" : undefined}
            icon={Clock}
          />
          <KpiCard
            title="Commission moyenne"
            value={`${analytics.averageCommissionRate.toFixed(1)}%`}
            icon={Percent}
          />
          <KpiCard
            title="CA sous contrat"
            value={formatCurrency(analytics.totalCAUnderContract)}
            icon={DollarSign}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput placeholder="Rechercher par propriétaire, logement..." />
        <StatusFilter options={statusOptions} placeholder="Tous les statuts" />
        <StatusFilter paramName="type" options={typeOptions} placeholder="Tous les types" />
        <StatusFilter paramName="proprietaire_id" options={proprietaireOptions} placeholder="Tous les propriétaires" />
        <ExportCSVButton type="contrats" filters={{ status: searchParams.status, type: searchParams.type }} />
      </div>
      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {data?.map((c) => {
          const endDate = new Date(c.end_date);
          const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const isExpiringSoon = c.status === "ACTIF" && daysRemaining > 0 && daysRemaining <= 30;

          return (
            <div key={c.id} className="border rounded-lg p-3 bg-card">
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge
                  value={c.type}
                  label={CONTRACT_TYPE_LABELS[c.type as keyof typeof CONTRACT_TYPE_LABELS]}
                />
                <StatusBadge
                  value={c.status}
                  label={CONTRACT_STATUS_LABELS[c.status as keyof typeof CONTRACT_STATUS_LABELS]}
                  className="ml-auto"
                />
              </div>
              <Link href={`/contrats/${c.id}`} className="block">
                <p className="font-medium text-sm">
                  {(c.proprietaire as { full_name: string } | null)?.full_name ?? "\u2014"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {c.logement_id
                    ? (c.logement as { name: string } | null)?.name ?? "\u2014"
                    : "Tous les logements"}
                </p>
              </Link>
              <div className="mt-2 pt-2 border-t flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {new Date(c.start_date).toLocaleDateString("fr-FR")} — {new Date(c.end_date).toLocaleDateString("fr-FR")}
                </span>
                {isExpiringSoon && (
                  <span className="flex items-center gap-1 text-orange-600 font-medium">
                    <AlertCircle className="h-3 w-3" />
                    {daysRemaining}j
                  </span>
                )}
                <span className="ml-auto font-medium text-foreground">{c.commission_rate}%</span>
              </div>
            </div>
          );
        })}
        {(!data || data.length === 0) && (
          <EmptyState
            variant="inline"
            icon={FileText}
            title="Aucun contrat trouvé"
            description="Les contrats avec vos propriétaires apparaîtront ici"
            action={{ label: "Nouveau contrat", href: "/contrats/new" }}
          />
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Propriétaire</TableHead>
              <TableHead>Logement</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((c) => {
              const endDate = new Date(c.end_date);
              const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isExpiringSoon = c.status === "ACTIF" && daysRemaining > 0 && daysRemaining <= 30;

              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      href={`/contrats/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {(c.proprietaire as { full_name: string } | null)?.full_name ?? "\u2014"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {c.logement_id ? (
                      <Link
                        href={`/logements/${c.logement_id}`}
                        className="text-primary hover:underline"
                      >
                        {(c.logement as { name: string } | null)?.name ?? "\u2014"}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Tous les logements</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      value={c.type}
                      label={CONTRACT_TYPE_LABELS[c.type as keyof typeof CONTRACT_TYPE_LABELS]}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      <span>
                        {new Date(c.start_date).toLocaleDateString('fr-FR')} — {new Date(c.end_date).toLocaleDateString('fr-FR')}
                      </span>
                      {isExpiringSoon && (
                        <span className="flex items-center gap-1 text-orange-600 text-xs font-medium">
                          <AlertCircle className="h-4 w-4" />
                          {daysRemaining}j
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{c.commission_rate}%</TableCell>
                  <TableCell>
                    <StatusBadge
                      value={c.status}
                      label={CONTRACT_STATUS_LABELS[c.status as keyof typeof CONTRACT_STATUS_LABELS]}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {(!data || data.length === 0) && (
              <EmptyState
                icon={FileText}
                title="Aucun contrat trouvé"
                description="Les contrats avec vos propriétaires apparaîtront ici"
                colSpan={6}
              />
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination totalCount={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
