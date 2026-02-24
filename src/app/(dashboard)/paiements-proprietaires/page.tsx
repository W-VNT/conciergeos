import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnerPayments, markOwnerPaymentPaid, markOwnerPaymentPartial, deleteOwnerPayment } from "@/lib/actions/owner-payments";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusFilter } from "@/components/shared/status-filter";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OWNER_PAYMENT_STATUS_LABELS } from "@/types/database";
import type { OwnerPayment, OwnerPaymentStatus } from "@/types/database";
import { formatCurrency } from "@/lib/format-currency";
import { Clock, CheckCircle, AlertTriangle, Banknote, Trash2 } from "lucide-react";
import Link from "next/link";
import { CreateOwnerPaymentDialog } from "@/components/proprietaires/create-owner-payment-dialog";

export const metadata = { title: "Paiements propriétaires" };
export const dynamic = "force-dynamic";

export default async function PaiementsProprietairesPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) redirect("/dashboard");

  const supabase = createClient();

  // Fetch proprietaires for the create dialog
  const { data: proprietaires } = await supabase
    .from("proprietaires")
    .select("id, full_name")
    .eq("organisation_id", profile.organisation_id)
    .order("full_name");

  const payments = await getOwnerPayments({
    status: searchParams.status,
    proprietaire_search: searchParams.q,
  });

  // KPIs from all payments (not filtered)
  const allPayments = searchParams.status
    ? await getOwnerPayments()
    : payments;

  const totalDu = allPayments
    .filter((p) => p.status === "DU" || p.status === "EN_RETARD")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPaye = allPayments
    .filter((p) => p.status === "PAYE")
    .reduce((sum, p) => sum + p.paid_amount, 0);
  const totalEnRetard = allPayments
    .filter((p) => p.status === "EN_RETARD")
    .reduce((sum, p) => sum + p.amount, 0);

  const statusOptions = Object.entries(OWNER_PAYMENT_STATUS_LABELS).map(([v, l]) => ({
    value: v,
    label: l,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paiements propriétaires"
        showCreate={false}
      >
        <CreateOwnerPaymentDialog proprietaires={proprietaires ?? []} />
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <KpiCard
          title="Total dû"
          value={formatCurrency(totalDu)}
          description={`${allPayments.filter((p) => p.status === "DU" || p.status === "EN_RETARD").length} paiement(s)`}
          icon={Clock}
        />
        <KpiCard
          title="Total payé"
          value={formatCurrency(totalPaye)}
          description={`${allPayments.filter((p) => p.status === "PAYE").length} paiement(s)`}
          icon={CheckCircle}
        />
        <KpiCard
          title="En retard"
          value={formatCurrency(totalEnRetard)}
          description={`${allPayments.filter((p) => p.status === "EN_RETARD").length} paiement(s)`}
          icon={AlertTriangle}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput placeholder="Rechercher un propriétaire..." />
        <StatusFilter
          paramName="status"
          options={statusOptions}
          placeholder="Tous les statuts"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              Aucun paiement trouvé.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-3 font-medium">Propriétaire</th>
                    <th className="p-3 font-medium text-right">Montant dû</th>
                    <th className="p-3 font-medium text-right">Montant payé</th>
                    <th className="p-3 font-medium">Période</th>
                    <th className="p-3 font-medium">Statut</th>
                    <th className="p-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <PaymentRow key={payment.id} payment={payment} />
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

function PaymentRow({ payment }: { payment: OwnerPayment }) {
  const proprietaire = payment.proprietaire as { id: string; full_name: string } | null;

  const periodLabel =
    payment.period_start && payment.period_end
      ? `${new Date(payment.period_start).toLocaleDateString("fr-FR")} — ${new Date(payment.period_end).toLocaleDateString("fr-FR")}`
      : payment.period_start
      ? `À partir du ${new Date(payment.period_start).toLocaleDateString("fr-FR")}`
      : "—";

  return (
    <tr className="border-b last:border-0 hover:bg-muted/50">
      <td className="p-3">
        {proprietaire ? (
          <Link
            href={`/proprietaires/${proprietaire.id}`}
            className="font-medium hover:underline"
          >
            {proprietaire.full_name}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="p-3 text-right font-medium whitespace-nowrap">
        {formatCurrency(payment.amount)}
      </td>
      <td className="p-3 text-right whitespace-nowrap">
        {formatCurrency(payment.paid_amount)}
      </td>
      <td className="p-3 whitespace-nowrap text-muted-foreground">
        {periodLabel}
      </td>
      <td className="p-3">
        <StatusBadge
          value={payment.status}
          label={OWNER_PAYMENT_STATUS_LABELS[payment.status as OwnerPaymentStatus]}
        />
      </td>
      <td className="p-3">
        <div className="flex items-center justify-end gap-1">
          {(payment.status === "DU" || payment.status === "EN_RETARD") && (
            <form
              action={async () => {
                "use server";
                await markOwnerPaymentPaid(payment.id, payment.amount);
              }}
            >
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600 hover:text-green-700"
                title="Marquer payé"
              >
                <Banknote className="h-4 w-4" />
              </Button>
            </form>
          )}
          {(payment.status === "DU" || payment.status === "EN_RETARD") && (
            <form
              action={async () => {
                "use server";
                await markOwnerPaymentPartial(payment.id, Math.round(payment.amount / 2));
              }}
            >
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-blue-600 hover:text-blue-700"
                title="Paiement partiel"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            </form>
          )}
          <form
            action={async () => {
              "use server";
              await deleteOwnerPayment(payment.id);
            }}
          >
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </td>
    </tr>
  );
}
