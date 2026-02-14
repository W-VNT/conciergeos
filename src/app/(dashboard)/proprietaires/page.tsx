import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";
import { SERVICE_LEVEL_LABELS } from "@/types/database";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

export const revalidate = 30;

const PAGE_SIZE = 20;

export default async function ProprietairesPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
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

  if (searchParams.q) {
    query = query.ilike("full_name", `%${searchParams.q}%`);
  }

  const { data, count } = await query;

  return (
    <div>
      <PageHeader title="Propriétaires" createHref="/proprietaires/new" createLabel="Nouveau propriétaire" showCreate={admin} />
      <div className="mb-4">
        <SearchInput placeholder="Rechercher un propriétaire..." />
      </div>
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Niveau</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link href={`/proprietaires/${p.id}`} className="font-medium hover:underline">{p.full_name}</Link>
                </TableCell>
                <TableCell>{p.phone ?? "—"}</TableCell>
                <TableCell>{p.email ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge value={p.service_level} label={SERVICE_LEVEL_LABELS[p.service_level as keyof typeof SERVICE_LEVEL_LABELS]} />
                </TableCell>
              </TableRow>
            ))}
            {(!data || data.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Aucun propriétaire trouvé</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination totalCount={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
