import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusFilter } from "@/components/shared/status-filter";
import { Pagination } from "@/components/shared/pagination";
import { RESERVATION_STATUS_LABELS, BOOKING_PLATFORM_LABELS } from "@/types/database";
import { ReservationsTableWithSelection } from "@/components/reservations/reservations-table-with-selection";

const PAGE_SIZE = 20;

export const revalidate = 30;

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; platform?: string; logement_id?: string; page?: string };
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

  if (searchParams.q) query = query.or(`guest_name.ilike.%${searchParams.q}%,guest_email.ilike.%${searchParams.q}%`);
  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.platform) query = query.eq("platform", searchParams.platform);
  if (searchParams.logement_id) query = query.eq("logement_id", searchParams.logement_id);

  const [{ data, count }, { data: logements }] = await Promise.all([
    query,
    supabase.from("logements").select("id, name").eq("status", "ACTIF").order("name"),
  ]);

  const statusOptions = Object.entries(RESERVATION_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const platformOptions = Object.entries(BOOKING_PLATFORM_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const logementOptions = (logements ?? []).map((l) => ({ value: l.id, label: l.name }));

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
        <StatusFilter paramName="platform" options={platformOptions} placeholder="Toutes les plateformes" />
        <StatusFilter paramName="logement_id" options={logementOptions} placeholder="Tous les logements" />
      </div>
      <ReservationsTableWithSelection reservations={data || []} />
      <Pagination totalCount={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
