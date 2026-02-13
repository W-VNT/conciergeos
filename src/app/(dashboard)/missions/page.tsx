import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusFilter } from "@/components/shared/status-filter";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";
import { MISSION_STATUS_LABELS, MISSION_TYPE_LABELS, MISSION_PRIORITY_LABELS } from "@/types/database";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportCSVButton } from "@/components/shared/export-csv-button";
import { CompleteMissionButton } from "@/components/shared/complete-mission-button";
import Link from "next/link";

const PAGE_SIZE = 20;

export default async function MissionsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; type?: string; page?: string };
}) {
  await requireProfile();
  const supabase = createClient();
  const page = Number(searchParams.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("missions")
    .select("*, logement:logements(name), assignee:profiles(full_name)", { count: "exact" })
    .order("scheduled_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (searchParams.q) query = query.ilike("notes", `%${searchParams.q}%`);
  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.type) query = query.eq("type", searchParams.type);

  const { data, count } = await query;
  const statusOptions = Object.entries(MISSION_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const typeOptions = Object.entries(MISSION_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }));

  return (
    <div>
      <PageHeader title="Missions" createHref="/missions/new" createLabel="Nouvelle mission">
        <ExportCSVButton type="missions" filters={{ status: searchParams.status, type: searchParams.type }} />
      </PageHeader>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput placeholder="Rechercher dans les notes..." />
        <StatusFilter options={statusOptions} placeholder="Tous les statuts" />
        <StatusFilter paramName="type" options={typeOptions} placeholder="Tous les types" />
      </div>
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Logement</TableHead>
              <TableHead>Assigné</TableHead>
              <TableHead>Planifié</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((m) => (
              <TableRow key={m.id}>
                <TableCell><Link href={`/missions/${m.id}`} className="hover:underline"><StatusBadge value={m.type} label={MISSION_TYPE_LABELS[m.type as keyof typeof MISSION_TYPE_LABELS]} /></Link></TableCell>
                <TableCell>{(m.logement as { name: string } | null)?.name ?? "—"}</TableCell>
                <TableCell>{(m.assignee as { full_name: string } | null)?.full_name ?? "—"}</TableCell>
                <TableCell className="text-sm">{new Date(m.scheduled_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</TableCell>
                <TableCell><StatusBadge value={m.priority} label={MISSION_PRIORITY_LABELS[m.priority as keyof typeof MISSION_PRIORITY_LABELS]} /></TableCell>
                <TableCell><StatusBadge value={m.status} label={MISSION_STATUS_LABELS[m.status as keyof typeof MISSION_STATUS_LABELS]} /></TableCell>
                <TableCell>{m.status !== "TERMINE" && m.status !== "ANNULE" && <CompleteMissionButton missionId={m.id} />}</TableCell>
              </TableRow>
            ))}
            {(!data || data.length === 0) && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucune mission trouvée</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination totalCount={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
