import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllFactures, validateFacture, markFacturePaid, refuseFacture } from "@/lib/actions/factures-prestataires";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusFilter } from "@/components/shared/status-filter";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FACTURE_STATUS_LABELS } from "@/types/database";
import type { FacturePrestataire, FactureStatus } from "@/types/database";
import { formatCurrency } from "@/lib/format-currency";
import { Clock, CheckCircle, CreditCard, Eye, Check, X, Banknote } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Factures prestataires" };
export const dynamic = "force-dynamic";

export default async function FacturesPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) redirect("/dashboard");

  const factures = await getAllFactures({
    status: searchParams.status,
    prestataire_search: searchParams.q,
  });

  // Compute summary KPIs
  const totalAttente = factures
    .filter((f) => f.status === "ATTENTE")
    .reduce((sum, f) => sum + f.montant, 0);
  const totalValidee = factures
    .filter((f) => f.status === "VALIDEE")
    .reduce((sum, f) => sum + f.montant, 0);
  const totalPayee = factures
    .filter((f) => f.status === "PAYEE")
    .reduce((sum, f) => sum + f.montant, 0);

  // For KPI: compute from all factures (not filtered)
  const allFactures = searchParams.status
    ? await getAllFactures()
    : factures;
  const kpiAttente = allFactures
    .filter((f) => f.status === "ATTENTE")
    .reduce((sum, f) => sum + f.montant, 0);
  const kpiValidee = allFactures
    .filter((f) => f.status === "VALIDEE")
    .reduce((sum, f) => sum + f.montant, 0);
  const kpiPayee = allFactures
    .filter((f) => f.status === "PAYEE")
    .reduce((sum, f) => sum + f.montant, 0);

  const statusOptions = Object.entries(FACTURE_STATUS_LABELS).map(([v, l]) => ({
    value: v,
    label: l,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Factures prestataires"
        showCreate={false}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <KpiCard
          title="En attente"
          value={formatCurrency(kpiAttente)}
          description={`${allFactures.filter((f) => f.status === "ATTENTE").length} facture(s)`}
          icon={Clock}
        />
        <KpiCard
          title="Validées"
          value={formatCurrency(kpiValidee)}
          description={`${allFactures.filter((f) => f.status === "VALIDEE").length} facture(s)`}
          icon={CheckCircle}
        />
        <KpiCard
          title="Payées"
          value={formatCurrency(kpiPayee)}
          description={`${allFactures.filter((f) => f.status === "PAYEE").length} facture(s)`}
          icon={CreditCard}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput placeholder="Rechercher un prestataire..." />
        <StatusFilter
          paramName="status"
          options={statusOptions}
          placeholder="Tous les statuts"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {factures.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              Aucune facture trouvée.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-3 font-medium">N° Facture</th>
                    <th className="p-3 font-medium">Prestataire</th>
                    <th className="p-3 font-medium text-right">Montant</th>
                    <th className="p-3 font-medium">Date émission</th>
                    <th className="p-3 font-medium">Échéance</th>
                    <th className="p-3 font-medium">Statut</th>
                    <th className="p-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {factures.map((facture) => (
                    <FactureRow key={facture.id} facture={facture} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FactureRow({ facture }: { facture: FacturePrestataire }) {
  const prestataire = facture.prestataire as { id: string; full_name: string } | null;

  return (
    <tr className="border-b last:border-0 hover:bg-muted/50">
      <td className="p-3">
        <Link
          href={`/factures/${facture.id}`}
          className="font-medium hover:underline"
        >
          {facture.numero_facture || `#${facture.id.slice(0, 8)}`}
        </Link>
      </td>
      <td className="p-3">
        {prestataire ? (
          <Link
            href={`/prestataires/${prestataire.id}`}
            className="hover:underline"
          >
            {prestataire.full_name}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="p-3 text-right font-medium whitespace-nowrap">
        {formatCurrency(facture.montant)}
      </td>
      <td className="p-3 whitespace-nowrap">
        {new Date(facture.date_emission).toLocaleDateString("fr-FR")}
      </td>
      <td className="p-3 whitespace-nowrap">
        {facture.date_echeance
          ? new Date(facture.date_echeance).toLocaleDateString("fr-FR")
          : "—"}
      </td>
      <td className="p-3">
        <StatusBadge
          value={facture.status}
          label={FACTURE_STATUS_LABELS[facture.status as FactureStatus]}
        />
      </td>
      <td className="p-3">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/factures/${facture.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          {facture.status === "ATTENTE" && (
            <form
              action={async () => {
                "use server";
                await validateFacture(facture.id);
              }}
            >
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-600 hover:text-blue-700"
                title="Valider"
              >
                <Check className="h-4 w-4" />
              </Button>
            </form>
          )}
          {facture.status === "VALIDEE" && (
            <form
              action={async () => {
                "use server";
                await markFacturePaid(facture.id);
              }}
            >
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600 hover:text-green-700"
                title="Marquer payée"
              >
                <Banknote className="h-4 w-4" />
              </Button>
            </form>
          )}
          {facture.status !== "PAYEE" && facture.status !== "REFUSEE" && (
            <form
              action={async () => {
                "use server";
                await refuseFacture(facture.id);
              }}
            >
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700"
                title="Refuser"
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </td>
    </tr>
  );
}
