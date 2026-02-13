import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";
import { SPECIALTY_LABELS } from "@/types/database";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Star } from "lucide-react";

const PAGE_SIZE = 20;

export default async function PrestatairesPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();
  const page = Number(searchParams.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase.from("prestataires").select("*", { count: "exact" }).order("full_name").range(from, from + PAGE_SIZE - 1);
  if (searchParams.q) query = query.ilike("full_name", `%${searchParams.q}%`);
  const { data, count } = await query;

  return (
    <div>
      <PageHeader title="Prestataires" createHref="/prestataires/new" createLabel="Nouveau prestataire" showCreate={admin} />
      <div className="mb-4"><SearchInput placeholder="Rechercher un prestataire..." /></div>
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead><TableHead>Spécialité</TableHead><TableHead>Téléphone</TableHead><TableHead>Zone</TableHead><TableHead>Fiabilité</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((p) => (
              <TableRow key={p.id}>
                <TableCell><Link href={`/prestataires/${p.id}`} className="font-medium hover:underline">{p.full_name}</Link></TableCell>
                <TableCell><StatusBadge value={p.specialty} label={SPECIALTY_LABELS[p.specialty as keyof typeof SPECIALTY_LABELS]} /></TableCell>
                <TableCell>{p.phone ?? "—"}</TableCell>
                <TableCell>{p.zone ?? "—"}</TableCell>
                <TableCell>{p.reliability_score ? <div className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /><span className="text-sm">{p.reliability_score}/5</span></div> : "—"}</TableCell>
              </TableRow>
            ))}
            {(!data || data.length === 0) && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucun prestataire trouvé</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <Pagination totalCount={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
