import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusFilter } from "@/components/shared/status-filter";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";
import { RESERVATION_STATUS_LABELS, BOOKING_PLATFORM_LABELS } from "@/types/database";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

const PAGE_SIZE = 20;

export const revalidate = 30;

export default async function ReservationsPage({
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
    .from("reservations")
    .select("*, logement:logements(name)", { count: "exact" })
    .order("check_in_date", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (searchParams.q) {
    query = query.or(`guest_name.ilike.%${searchParams.q}%,guest_email.ilike.%${searchParams.q}%`);
  }

  if (searchParams.status) query = query.eq("status", searchParams.status);

  const { data, count } = await query;
  const statusOptions = Object.entries(RESERVATION_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));

  return (
    <div>
      <PageHeader
        title="Réservations"
        createHref="/reservations/new"
        createLabel="Nouvelle réservation"
        showCreate={admin}
      />
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput placeholder="Rechercher un voyageur..." />
        <StatusFilter options={statusOptions} placeholder="Tous les statuts" />
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Voyageur</TableHead>
              <TableHead>Logement</TableHead>
              <TableHead>Arrivée - Départ</TableHead>
              <TableHead>Voyageurs</TableHead>
              <TableHead>Plateforme</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((r) => {
              const nights = Math.ceil(
                (new Date(r.check_out_date).getTime() - new Date(r.check_in_date).getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/reservations/${r.id}`} className="font-medium hover:underline">
                      {r.guest_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {r.logement_id ? (
                      <Link
                        href={`/logements/${r.logement_id}`}
                        className="text-primary hover:underline"
                      >
                        {(r.logement as { name: string } | null)?.name ?? "—"}
                      </Link>
                    ) : (
                      <span>—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>
                      {new Date(r.check_in_date).toLocaleDateString("fr-FR")} —{" "}
                      {new Date(r.check_out_date).toLocaleDateString("fr-FR")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {nights} nuit{nights > 1 ? "s" : ""}
                    </div>
                  </TableCell>
                  <TableCell>{r.guest_count}</TableCell>
                  <TableCell>
                    <StatusBadge
                      value={r.platform}
                      label={BOOKING_PLATFORM_LABELS[r.platform as keyof typeof BOOKING_PLATFORM_LABELS]}
                    />
                  </TableCell>
                  <TableCell>{r.amount ? `${r.amount}€` : "—"}</TableCell>
                  <TableCell>
                    <StatusBadge
                      value={r.status}
                      label={RESERVATION_STATUS_LABELS[r.status as keyof typeof RESERVATION_STATUS_LABELS]}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {(!data || data.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Aucune réservation trouvée
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
