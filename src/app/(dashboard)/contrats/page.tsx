import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusFilter } from "@/components/shared/status-filter";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";
import { CONTRACT_STATUS_LABELS, CONTRACT_TYPE_LABELS } from "@/types/database";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 20;

export const revalidate = 30;

export default async function ContratsPage({
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
    .from("contrats")
    .select("*, proprietaire:proprietaires(full_name), logement:logements(name)", { count: "exact" })
    .order("start_date", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  // Search by proprietaire or logement name
  if (searchParams.q) {
    // Note: This requires a more complex query - for now we'll search in conditions text
    // In a real app, you'd want to use a full-text search or join filters
    query = query.or(`conditions.ilike.%${searchParams.q}%`);
  }

  if (searchParams.status) query = query.eq("status", searchParams.status);

  const { data, count } = await query;
  const statusOptions = Object.entries(CONTRACT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));

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
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput placeholder="Rechercher un contrat..." />
        <StatusFilter options={statusOptions} placeholder="Tous les statuts" />
      </div>
      <div className="rounded-lg border bg-card">
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
                      {(c.proprietaire as { full_name: string } | null)?.full_name ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {c.logement_id ? (
                      <Link
                        href={`/logements/${c.logement_id}`}
                        className="text-primary hover:underline"
                      >
                        {(c.logement as { name: string } | null)?.name ?? "—"}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Tous logements</span>
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
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Aucun contrat trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination totalCount={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
