import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusFilter } from "@/components/shared/status-filter";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";
import { LOGEMENT_STATUS_LABELS, OFFER_TIER_LABELS } from "@/types/database";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Map } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 20;

export const revalidate = 30;

export default async function LogementsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string };
}) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();
  const page = Number(searchParams.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("logements")
    .select("*, proprietaire:proprietaires(full_name)", { count: "exact" })
    .order("name")
    .range(from, from + PAGE_SIZE - 1);

  if (searchParams.q) query = query.ilike("name", `%${searchParams.q}%`);
  if (searchParams.status) query = query.eq("status", searchParams.status);

  const { data, count } = await query;
  const statusOptions = Object.entries(LOGEMENT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));

  return (
    <div>
      <PageHeader title="Logements" createHref="/logements/new" createLabel="Nouveau logement" showCreate={admin}>
        <Button variant="outline" asChild>
          <Link href="/logements/carte">
            <Map className="h-4 w-4 mr-2" />
            Voir la carte
          </Link>
        </Button>
      </PageHeader>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput placeholder="Rechercher un logement..." />
        <StatusFilter options={statusOptions} placeholder="Tous les statuts" />
      </div>
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Propriétaire</TableHead>
              <TableHead>Offre</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((l) => (
              <TableRow key={l.id}>
                <TableCell><Link href={`/logements/${l.id}`} className="font-medium hover:underline">{l.name}</Link></TableCell>
                <TableCell>{l.city ?? "—"}</TableCell>
                <TableCell>{(l.proprietaire as { full_name: string } | null)?.full_name ?? "—"}</TableCell>
                <TableCell><StatusBadge value={l.offer_tier} label={OFFER_TIER_LABELS[l.offer_tier as keyof typeof OFFER_TIER_LABELS]} /></TableCell>
                <TableCell><StatusBadge value={l.status} label={LOGEMENT_STATUS_LABELS[l.status as keyof typeof LOGEMENT_STATUS_LABELS]} /></TableCell>
              </TableRow>
            ))}
            {(!data || data.length === 0) && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucun logement trouvé</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination totalCount={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
