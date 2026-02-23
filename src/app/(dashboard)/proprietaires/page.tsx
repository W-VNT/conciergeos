import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusFilter } from "@/components/shared/status-filter";
import { Pagination } from "@/components/shared/pagination";
import { STATUT_JURIDIQUE_LABELS } from "@/types/database";
import { ProprietairesTableWithSelection } from "@/components/proprietaires/proprietaires-table-with-selection";

export const metadata = { title: "Propriétaires" };
export const revalidate = 30;

const PAGE_SIZE = 20;

export default async function ProprietairesPage({
  searchParams,
}: {
  searchParams: { q?: string; statut_juridique?: string; page?: string };
}) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();
  const page = Number(searchParams.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("proprietaires")
    .select("*", { count: "exact" })
    .order("full_name")
    .range(from, from + PAGE_SIZE - 1);

  if (searchParams.q) query = query.ilike("full_name", `%${searchParams.q}%`);
  if (searchParams.statut_juridique) query = query.eq("statut_juridique", searchParams.statut_juridique);

  const { data, count } = await query;
  const statutOptions = Object.entries(STATUT_JURIDIQUE_LABELS).map(([v, l]) => ({ value: v, label: l }));

  return (
    <div>
      <PageHeader title="Propriétaires" createHref="/proprietaires/new" createLabel="Nouveau propriétaire" showCreate={admin} />
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput placeholder="Rechercher un propriétaire..." />
        <StatusFilter paramName="statut_juridique" options={statutOptions} placeholder="Tous les statuts juridiques" />
      </div>
      <ProprietairesTableWithSelection proprietaires={data || []} />
      <Pagination totalCount={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
