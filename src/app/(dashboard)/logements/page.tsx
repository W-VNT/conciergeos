import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusFilter } from "@/components/shared/status-filter";
import { Pagination } from "@/components/shared/pagination";
import { LOGEMENT_STATUS_LABELS, OFFER_TIER_LABELS } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Map } from "lucide-react";
import Link from "next/link";
import { LogementsTableWithSelection } from "@/components/logements/logements-table-with-selection";

export const metadata = { title: "Logements" };

const PAGE_SIZE = 20;

export const revalidate = 0;

export default async function LogementsPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ q?: string; status?: string; offer_tier?: string; city?: string; tag?: string; page?: string }>;
}) {
  const searchParams = await searchParamsPromise;
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = await createClient();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("logements")
    .select("*, proprietaire:proprietaires(full_name)", { count: "exact" })
    .eq("organisation_id", profile.organisation_id)
    .order("name")
    .range(from, from + PAGE_SIZE - 1);

  if (searchParams.q) {
    const sanitized = searchParams.q.replace(/%/g, '\\%').replace(/_/g, '\\_');
    query = query.ilike("name", `%${sanitized}%`);
  }
  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.offer_tier) query = query.eq("offer_tier", searchParams.offer_tier);
  if (searchParams.city) query = query.eq("city", searchParams.city);
  if (searchParams.tag) query = query.contains("tags", [searchParams.tag]);

  const [{ data, count }, { data: allLogements }, { data: allTags }] = await Promise.all([
    query,
    supabase.from("logements").select("city").eq("organisation_id", profile.organisation_id).not("city", "is", null),
    supabase.from("logements").select("tags").eq("organisation_id", profile.organisation_id).not("tags", "is", null),
  ]);

  const cities = Array.from(new Set((allLogements ?? []).map((l) => l.city as string))).sort();
  const tags = Array.from(new Set((allTags ?? []).flatMap((l) => (l.tags as string[]) || []))).sort();

  const statusOptions = Object.entries(LOGEMENT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const offerOptions = Object.entries(OFFER_TIER_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const cityOptions = cities.map((c) => ({ value: c, label: c }));
  const tagOptions = tags.map((t) => ({ value: t, label: t }));

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
        <StatusFilter paramName="offer_tier" options={offerOptions} placeholder="Toutes les offres" />
        <StatusFilter paramName="city" options={cityOptions} placeholder="Toutes les villes" />
        {tagOptions.length > 0 && (
          <StatusFilter paramName="tag" options={tagOptions} placeholder="Tous les tags" />
        )}
      </div>
      <LogementsTableWithSelection logements={data || []} canBulkDelete={admin} />
      <Pagination totalCount={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
