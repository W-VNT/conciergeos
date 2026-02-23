import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusFilter } from "@/components/shared/status-filter";
import { Pagination } from "@/components/shared/pagination";
import { SPECIALTY_LABELS } from "@/types/database";
import { PrestatairesTableWithSelection } from "@/components/prestataires/prestataires-table-with-selection";

export const metadata = { title: "Prestataires" };
export const revalidate = 30;

const PAGE_SIZE = 20;

export default async function PrestatairesPage({ searchParams }: { searchParams: { q?: string; specialty?: string; page?: string } }) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();
  const page = Number(searchParams.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase.from("prestataires").select("*", { count: "exact" }).order("full_name").range(from, from + PAGE_SIZE - 1);
  if (searchParams.q) query = query.ilike("full_name", `%${searchParams.q}%`);
  if (searchParams.specialty) query = query.eq("specialty", searchParams.specialty);

  const { data, count } = await query;

  const specialtyOptions = Object.entries(SPECIALTY_LABELS).map(([v, l]) => ({ value: v, label: l }));

  return (
    <div>
      <PageHeader title="Prestataires" createHref="/prestataires/new" createLabel="Nouveau prestataire" showCreate={admin} />
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput placeholder="Rechercher un prestataire..." />
        <StatusFilter paramName="specialty" options={specialtyOptions} placeholder="Toutes les spécialités" />
      </div>
      <PrestatairesTableWithSelection prestataires={data || []} />
      <Pagination totalCount={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
