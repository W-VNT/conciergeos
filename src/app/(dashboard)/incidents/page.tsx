import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusFilter } from "@/components/shared/status-filter";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";
import { INCIDENT_STATUS_LABELS, INCIDENT_SEVERITY_LABELS } from "@/types/database";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportCSVButton } from "@/components/shared/export-csv-button";
import Link from "next/link";

export const revalidate = 30;

const PAGE_SIZE = 20;

export default async function IncidentsPage({ searchParams }: { searchParams: { q?: string; status?: string; severity?: string; page?: string } }) {
  await requireProfile();
  const supabase = createClient();
  const page = Number(searchParams.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase.from("incidents").select("*, logement:logements(name), prestataire:prestataires(full_name)", { count: "exact" }).order("opened_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
  if (searchParams.q) query = query.ilike("description", `%${searchParams.q}%`);
  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.severity) query = query.eq("severity", searchParams.severity);
  const { data, count } = await query;

  const statusOptions = Object.entries(INCIDENT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const severityOptions = Object.entries(INCIDENT_SEVERITY_LABELS).map(([v, l]) => ({ value: v, label: l }));

  return (
    <div>
      <PageHeader title="Incidents" createHref="/incidents/new" createLabel="Nouvel incident">
        <ExportCSVButton type="incidents" filters={{ status: searchParams.status, severity: searchParams.severity }} />
      </PageHeader>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput placeholder="Rechercher dans description..." />
        <StatusFilter options={statusOptions} placeholder="Tous les statuts" />
        <StatusFilter paramName="severity" options={severityOptions} placeholder="Toutes sévérités" />
      </div>
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader><TableRow><TableHead>Sévérité</TableHead><TableHead>Description</TableHead><TableHead>Logement</TableHead><TableHead>Prestataire</TableHead><TableHead>Ouvert le</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
          <TableBody>
            {data?.map((i) => (
              <TableRow key={i.id}>
                <TableCell><StatusBadge value={i.severity} label={INCIDENT_SEVERITY_LABELS[i.severity as keyof typeof INCIDENT_SEVERITY_LABELS]} /></TableCell>
                <TableCell><Link href={`/incidents/${i.id}`} className="font-medium hover:underline">{(i.description as string)?.slice(0, 50)}</Link></TableCell>
                <TableCell>{(i.logement as { name: string } | null)?.name ?? "—"}</TableCell>
                <TableCell>{(i.prestataire as { full_name: string } | null)?.full_name ?? "—"}</TableCell>
                <TableCell className="text-sm">{new Date(i.opened_at).toLocaleDateString("fr-FR")}</TableCell>
                <TableCell><StatusBadge value={i.status} label={INCIDENT_STATUS_LABELS[i.status as keyof typeof INCIDENT_STATUS_LABELS]} /></TableCell>
              </TableRow>
            ))}
            {(!data || data.length === 0) && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun incident trouvé</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <Pagination totalCount={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
