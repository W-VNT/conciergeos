import { requireProfile, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { DateFilter, type DateRange } from "@/components/dashboard/date-filter";
import { getFinancialSummary, getRevenusByLogement, getAllRevenus, getMonthlyRevenues } from "@/lib/actions/finances";
import { getOwnerFinanceDashboard } from "@/lib/actions/owner-analytics";
import Link from "next/link";
import { formatCurrencyDecimals } from "@/lib/format-currency";
import { formatCurrency } from "@/lib/format-currency";
import { ExportCSVButton } from "@/components/shared/export-csv-button";
import { MonthlyChart } from "@/components/finances/monthly-chart";
import { StatusFilter } from "@/components/shared/status-filter";

export const metadata = { title: "Finances" };

export const dynamic = "force-dynamic";

interface FinancesPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function FinancesPage({ searchParams }: FinancesPageProps) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) redirect("/dashboard");
  const supabase = createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate date range based on filter
  const range = (searchParams.range as DateRange) || "30d";
  let startDate: Date;
  let endDate: Date = new Date(today);
  endDate.setHours(23, 59, 59, 999);

  if (range === "custom" && searchParams.start && searchParams.end) {
    startDate = new Date(searchParams.start as string);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(searchParams.end as string);
    endDate.setHours(23, 59, 59, 999);
  } else if (range === "7d") {
    startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 7);
  } else if (range === "90d") {
    startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 90);
  } else {
    // Default: 30d
    startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 30);
  }

  // Logement filter
  const logementId = (searchParams.logement_id as string) || undefined;

  // Fetch logements for filter dropdown
  const { data: logements } = await supabase
    .from("logements")
    .select("id, name")
    .eq("organisation_id", profile.organisation_id)
    .eq("status", "ACTIF")
    .order("name");

  const logementOptions = (logements || []).map((l) => ({
    value: l.id,
    label: l.name,
  }));

  // Get financial data
  const [summary, monthlyData, revenusByLogement, detailedRevenus, ownerRevenues] = await Promise.all([
    getFinancialSummary(startDate, endDate, logementId),
    getMonthlyRevenues(startDate, endDate),
    getRevenusByLogement(startDate, endDate, logementId),
    getAllRevenus(startDate, endDate, logementId),
    getOwnerFinanceDashboard(profile.organisation_id, startDate, endDate),
  ]);

  // Transform monthly data for the chart
  const chartData = (monthlyData || []).map((row: Record<string, unknown>) => ({
    mois: String(row.mois ?? ""),
    ca_brut: Number(row.ca_brut ?? row.total_brut ?? 0),
    commissions: Number(row.commissions ?? row.total_commissions ?? 0),
    marge: Number(row.marge ?? row.total_net ?? 0),
  }));

  const fmtEur = formatCurrency;

  // Format range label for display
  const rangeLabel =
    range === "7d"
      ? "7 derniers jours"
      : range === "90d"
      ? "90 derniers jours"
      : range === "custom"
      ? "Période personnalisée"
      : "30 derniers jours";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Finances</h1>
          <p className="text-muted-foreground mt-1">{rangeLabel}</p>
        </div>
        <div className="flex gap-2">
          <StatusFilter
            paramName="logement_id"
            options={logementOptions}
            placeholder="Tous les logements"
          />
          <ExportCSVButton type="finances" />
          <DateFilter />
        </div>
      </div>

      {/* KPIs financiers */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="CA Brut"
          value={fmtEur(summary.revenusBrut)}
          description="Revenus total réservations"
          icon={DollarSign}
        />
        <KpiCard
          title="Commissions"
          value={fmtEur(summary.commissions)}
          description="Commissions conciergerie"
          icon={TrendingUp}
        />
        <KpiCard
          title="Charges"
          value={fmtEur(summary.charges)}
          description="Coûts incidents & factures"
          icon={TrendingDown}
        />
        <KpiCard
          title="Marge nette"
          value={fmtEur(summary.marge)}
          description={summary.marge >= 0 ? "Positif" : "Négatif"}
          icon={PiggyBank}
        />
      </div>

      {/* Évolution mensuelle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Évolution mensuelle</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyChart data={chartData} />
        </CardContent>
      </Card>

      {/* Revenus par logement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenus par logement</CardTitle>
        </CardHeader>
        <CardContent>
          {revenusByLogement.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun revenu sur cette période
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-2 font-medium">Logement</th>
                    <th className="pb-2 font-medium text-right">Réservations</th>
                    <th className="pb-2 font-medium text-right">CA Brut</th>
                    <th className="pb-2 font-medium text-right">Commission</th>
                    <th className="pb-2 font-medium text-right">CA Net</th>
                  </tr>
                </thead>
                <tbody>
                  {revenusByLogement.map((item) => (
                    <tr key={item.logement_id} className="border-b last:border-0">
                      <td className="py-3">
                        <div>
                          <div className="font-medium">{item.logement_name}</div>
                          {item.logement_city && (
                            <div className="text-xs text-muted-foreground">
                              {item.logement_city}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right">{item.nb_reservations}</td>
                      <td className="py-3 text-right font-medium">
                        {fmtEur(item.total_brut)}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {fmtEur(item.total_commissions)}
                        <span className="text-xs ml-1">
                          ({item.taux_moyen.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium text-green-600">
                        {fmtEur(item.total_net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 font-bold">
                  <tr>
                    <td className="pt-3">Total</td>
                    <td className="pt-3 text-right">
                      {revenusByLogement.reduce((sum, i) => sum + i.nb_reservations, 0)}
                    </td>
                    <td className="pt-3 text-right">
                      {fmtEur(revenusByLogement.reduce((sum, i) => sum + i.total_brut, 0))}
                    </td>
                    <td className="pt-3 text-right">
                      {fmtEur(revenusByLogement.reduce((sum, i) => sum + i.total_commissions, 0))}
                    </td>
                    <td className="pt-3 text-right text-green-600">
                      {fmtEur(revenusByLogement.reduce((sum, i) => sum + i.total_net, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenus par propriétaire */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenus par propriétaire</CardTitle>
        </CardHeader>
        <CardContent>
          {ownerRevenues.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun revenu propriétaire sur cette période
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-2 font-medium">Propriétaire</th>
                    <th className="pb-2 font-medium text-right">Logements</th>
                    <th className="pb-2 font-medium text-right">CA Brut</th>
                    <th className="pb-2 font-medium text-right">Commissions</th>
                    <th className="pb-2 font-medium text-right">Net propriétaire</th>
                  </tr>
                </thead>
                <tbody>
                  {ownerRevenues.map((owner) => (
                    <tr key={owner.proprietaire_id} className="border-b last:border-0">
                      <td className="py-3">
                        <Link
                          href={`/proprietaires/${owner.proprietaire_id}`}
                          className="font-medium hover:underline"
                        >
                          {owner.proprietaire_name}
                        </Link>
                      </td>
                      <td className="py-3 text-right">{owner.nb_logements}</td>
                      <td className="py-3 text-right font-medium">
                        {fmtEur(owner.total_ca_brut)}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {fmtEur(owner.total_commissions)}
                      </td>
                      <td className="py-3 text-right font-medium text-green-600">
                        {fmtEur(owner.total_net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 font-bold">
                  <tr>
                    <td className="pt-3">Total</td>
                    <td className="pt-3 text-right">
                      {ownerRevenues.reduce((sum, o) => sum + o.nb_logements, 0)}
                    </td>
                    <td className="pt-3 text-right">
                      {fmtEur(ownerRevenues.reduce((sum, o) => sum + o.total_ca_brut, 0))}
                    </td>
                    <td className="pt-3 text-right">
                      {fmtEur(ownerRevenues.reduce((sum, o) => sum + o.total_commissions, 0))}
                    </td>
                    <td className="pt-3 text-right text-green-600">
                      {fmtEur(ownerRevenues.reduce((sum, o) => sum + o.total_net, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenus détaillés */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenus détaillés</CardTitle>
        </CardHeader>
        <CardContent>
          {detailedRevenus.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun revenu détaillé sur cette période
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-2 font-medium">Logement</th>
                    <th className="pb-2 font-medium">Voyageur</th>
                    <th className="pb-2 font-medium">Plateforme</th>
                    <th className="pb-2 font-medium">Check-in</th>
                    <th className="pb-2 font-medium">Check-out</th>
                    <th className="pb-2 font-medium text-right">Brut</th>
                    <th className="pb-2 font-medium text-right">Commission</th>
                    <th className="pb-2 font-medium text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedRevenus.map((rev) => {
                    const logement = Array.isArray(rev.logement) ? rev.logement[0] : rev.logement;
                    const reservation = Array.isArray(rev.reservation) ? rev.reservation[0] : rev.reservation;
                    return (
                      <tr key={rev.id} className="border-b last:border-0">
                        <td className="py-3">
                          {logement ? (
                            <Link href={`/logements/${logement.id}`} className="hover:underline font-medium">
                              {logement.name}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          {reservation?.guest_name ?? <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="py-3">
                          {reservation?.platform ?? <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="py-3 whitespace-nowrap">
                          {rev.date_checkin ? new Date(rev.date_checkin).toLocaleDateString("fr-FR") : "—"}
                        </td>
                        <td className="py-3 whitespace-nowrap">
                          {rev.date_checkout ? new Date(rev.date_checkout).toLocaleDateString("fr-FR") : "—"}
                        </td>
                        <td className="py-3 text-right font-medium whitespace-nowrap">
                          {formatCurrencyDecimals(Number(rev.montant_brut || 0))}
                        </td>
                        <td className="py-3 text-right text-muted-foreground whitespace-nowrap">
                          {formatCurrencyDecimals(Number(rev.montant_commission || 0))}
                        </td>
                        <td className="py-3 text-right font-medium text-green-600 whitespace-nowrap">
                          {formatCurrencyDecimals(Number(rev.montant_net || 0))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
