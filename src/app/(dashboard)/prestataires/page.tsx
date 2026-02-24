import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusFilter } from "@/components/shared/status-filter";
import { Pagination } from "@/components/shared/pagination";
import { SPECIALTY_LABELS } from "@/types/database";
import { PrestatairesTableWithSelection } from "@/components/prestataires/prestataires-table-with-selection";
import { ExportCSVButton } from "@/components/shared/export-csv-button";

export const metadata = { title: "Prestataires" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const ALLOWED_SORT_COLUMNS = ["full_name", "hourly_rate", "score", "statut_juridique"] as const;
type AllowedSortColumn = (typeof ALLOWED_SORT_COLUMNS)[number];

const SORT_COLUMN_MAP: Record<string, string> = {
  full_name: "full_name",
  hourly_rate: "hourly_rate",
  score: "reliability_score",
  statut_juridique: "statut_juridique",
};

const statutJuridiqueOptions = [
  { value: "AUTO_ENTREPRENEUR", label: "Auto-entrepreneur" },
  { value: "SARL", label: "SARL" },
  { value: "SAS", label: "SAS" },
  { value: "EURL", label: "EURL" },
  { value: "SASU", label: "SASU" },
  { value: "ASSOCIATION", label: "Association" },
  { value: "AUTRE", label: "Autre" },
];

const scoreMinOptions = [
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5" },
];

const tauxMaxOptions = [
  { value: "20", label: "20 \u20AC/h max" },
  { value: "30", label: "30 \u20AC/h max" },
  { value: "40", label: "40 \u20AC/h max" },
  { value: "50", label: "50 \u20AC/h max" },
  { value: "75", label: "75 \u20AC/h max" },
  { value: "100", label: "100 \u20AC/h max" },
];

export default async function PrestatairesPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    specialty?: string;
    statut_juridique?: string;
    score_min?: string;
    taux_max?: string;
    sort?: string;
    order?: string;
    page?: string;
  };
}) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();
  const page = Number(searchParams.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;

  // Determine sort column and order
  const sortParam = searchParams.sort;
  const orderParam = searchParams.order || "asc";
  const isValidSort = sortParam && ALLOWED_SORT_COLUMNS.includes(sortParam as AllowedSortColumn);
  const sortColumn = isValidSort ? SORT_COLUMN_MAP[sortParam!] : "full_name";
  const ascending = isValidSort ? orderParam === "asc" : true;

  let query = supabase
    .from("prestataires")
    .select("*", { count: "exact" })
    .eq("organisation_id", profile.organisation_id)
    .order(sortColumn, { ascending })
    .range(from, from + PAGE_SIZE - 1);

  if (searchParams.q) {
    const sanitized = searchParams.q.replace(/%/g, "\\%").replace(/_/g, "\\_");
    query = query.ilike("full_name", `%${sanitized}%`);
  }
  if (searchParams.specialty) query = query.eq("specialty", searchParams.specialty);
  if (searchParams.statut_juridique) query = query.eq("statut_juridique", searchParams.statut_juridique);
  if (searchParams.score_min) query = query.gte("reliability_score", Number(searchParams.score_min));
  if (searchParams.taux_max) query = query.lte("hourly_rate", Number(searchParams.taux_max));

  const { data, count } = await query;

  const specialtyOptions = Object.entries(SPECIALTY_LABELS).map(([v, l]) => ({ value: v, label: l }));

  return (
    <div>
      <PageHeader title="Prestataires" createHref="/prestataires/new" createLabel="Nouveau prestataire" showCreate={admin} />
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4">
        <SearchInput placeholder="Rechercher un prestataire..." />
        <StatusFilter paramName="specialty" options={specialtyOptions} placeholder="Toutes les sp\u00e9cialit\u00e9s" />
        <StatusFilter paramName="statut_juridique" options={statutJuridiqueOptions} placeholder="Tous les statuts" />
        <StatusFilter paramName="score_min" options={scoreMinOptions} placeholder="Score min." />
        <StatusFilter paramName="taux_max" options={tauxMaxOptions} placeholder="Taux max." />
        <ExportCSVButton type="prestataires" />
      </div>
      <PrestatairesTableWithSelection prestataires={data || []} />
      <Pagination totalCount={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
