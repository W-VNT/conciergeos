import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ETAT_DES_LIEUX_TYPE_LABELS,
  ETAT_DES_LIEUX_STATUS_LABELS,
} from "@/types/database";
import Link from "next/link";
import { formatDate } from "@/lib/format-date";
import { FilterBar } from "@/components/etats-des-lieux/filter-bar";

export const metadata = { title: "États des lieux" };
export const dynamic = "force-dynamic";

export default async function EtatsDesLieuxPage({
  searchParams,
}: {
  searchParams: { logement?: string; type?: string };
}) {
  const profile = await requireProfile();
  const canManage = isAdminOrManager(profile);
  const supabase = createClient();

  let query = supabase
    .from("etats_des_lieux")
    .select(
      "*, logement:logements(id, name), reservation:reservations(id, guest_name)"
    )
    .eq("organisation_id", profile.organisation_id)
    .order("created_at", { ascending: false });

  if (searchParams.logement) {
    query = query.eq("logement_id", searchParams.logement);
  }
  if (searchParams.type && (searchParams.type === "ENTREE" || searchParams.type === "SORTIE")) {
    query = query.eq("type", searchParams.type);
  }

  const { data: edls } = await query;

  // Fetch logements for the filter
  const { data: logements } = await supabase
    .from("logements")
    .select("id, name")
    .eq("organisation_id", profile.organisation_id)
    .eq("status", "ACTIF")
    .order("name");

  return (
    <div>
      <PageHeader
        title="États des lieux"
        createHref="/etats-des-lieux/new"
        createLabel="Nouvel état des lieux"
        showCreate={canManage}
      />

      <FilterBar
        logements={logements ?? []}
        currentLogement={searchParams.logement}
        currentType={searchParams.type}
      />

      {edls && edls.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logement</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden sm:table-cell">Voyageur</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {edls.map((edl) => {
                const logement = edl.logement as { id: string; name: string } | null;
                const reservation = edl.reservation as { id: string; guest_name: string } | null;
                return (
                  <TableRow key={edl.id}>
                    <TableCell className="font-medium">
                      {logement?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        value={edl.type}
                        label={ETAT_DES_LIEUX_TYPE_LABELS[edl.type as keyof typeof ETAT_DES_LIEUX_TYPE_LABELS]}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        value={edl.status}
                        label={ETAT_DES_LIEUX_STATUS_LABELS[edl.status as keyof typeof ETAT_DES_LIEUX_STATUS_LABELS]}
                      />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {reservation?.guest_name ?? "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {formatDate(edl.created_at)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/etats-des-lieux/${edl.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        Voir
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Aucun état des lieux enregistré.
        </div>
      )}
    </div>
  );
}
