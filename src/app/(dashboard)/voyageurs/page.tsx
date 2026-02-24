import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format-currency";
import Link from "next/link";
import { Star } from "lucide-react";

export const metadata = { title: "Voyageurs" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function VoyageursPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const profile = await requireProfile();
  const canManage = isAdminOrManager(profile);
  const supabase = createClient();
  const page = Number(searchParams.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("voyageurs")
    .select("*", { count: "exact" })
    .eq("organisation_id", profile.organisation_id)
    .order("full_name")
    .range(from, from + PAGE_SIZE - 1);

  if (searchParams.q) {
    const sanitized = searchParams.q.replace(/%/g, "\\%").replace(/_/g, "\\_");
    query = query.or(`full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`);
  }

  const { data: voyageurs, count } = await query;

  return (
    <div>
      <PageHeader
        title="Voyageurs"
        createHref="/voyageurs/new"
        createLabel="Nouveau voyageur"
        showCreate={canManage}
      />

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4">
        <SearchInput placeholder="Rechercher un voyageur..." />
      </div>

      {voyageurs && voyageurs.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                <TableHead className="text-center">Séjours</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Revenu</TableHead>
                <TableHead className="hidden md:table-cell text-center">Note</TableHead>
                <TableHead className="hidden lg:table-cell">Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {voyageurs.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <Link
                      href={`/voyageurs/${v.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {v.full_name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {v.email || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {v.phone || "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{v.total_stays}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right">
                    {v.total_revenue > 0 ? formatCurrency(v.total_revenue) : "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center">
                    {v.average_rating != null ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        {v.average_rating.toFixed(1)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(v.tags ?? []).slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {(v.tags ?? []).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{v.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          {searchParams.q
            ? "Aucun voyageur trouvé pour cette recherche."
            : "Aucun voyageur enregistré."}
        </div>
      )}

      {(count ?? 0) > PAGE_SIZE && (
        <div className="flex justify-center gap-2 mt-4">
          {page > 1 && (
            <Link
              href={`/voyageurs?page=${page - 1}${searchParams.q ? `&q=${searchParams.q}` : ""}`}
              className="text-sm text-primary hover:underline"
            >
              Page précédente
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} sur {Math.ceil((count ?? 0) / PAGE_SIZE)}
          </span>
          {page < Math.ceil((count ?? 0) / PAGE_SIZE) && (
            <Link
              href={`/voyageurs?page=${page + 1}${searchParams.q ? `&q=${searchParams.q}` : ""}`}
              className="text-sm text-primary hover:underline"
            >
              Page suivante
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
