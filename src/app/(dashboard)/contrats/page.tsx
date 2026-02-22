import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusFilter } from "@/components/shared/status-filter";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { CONTRACT_STATUS_LABELS, CONTRACT_TYPE_LABELS } from "@/types/database";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, FileText } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 20;

export const revalidate = 30;

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

  let query = supabase
    .from("contrats")
    .select("*, proprietaire:proprietaires(full_name), logement:logements(name)", { count: "exact" })
    .order("start_date", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (searchParams.q) query = query.or(`conditions.ilike.%${searchParams.q}%`);
  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.type) query = query.eq("type", searchParams.type);
  if (searchParams.proprietaire_id) query = query.eq("proprietaire_id", searchParams.proprietaire_id);

  const [{ data, count }, { data: proprietaires }] = await Promise.all([
    query,
    supabase.from("proprietaires").select("id, full_name").order("full_name"),
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
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput placeholder="Rechercher un contrat..." />
        <StatusFilter options={statusOptions} placeholder="Tous les statuts" />
        <StatusFilter paramName="type" options={typeOptions} placeholder="Tous les types" />
        <StatusFilter paramName="proprietaire_id" options={proprietaireOptions} placeholder="Tous les propriétaires" />
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
                  {(c.proprietaire as { full_name: string } | null)?.full_name ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {c.logement_id
                    ? (c.logement as { name: string } | null)?.name ?? "—"
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
