import { requireProfile } from "@/lib/auth";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { DateFilter, type DateRange } from "@/components/dashboard/date-filter";
import { getFinancialSummary, getRevenusByLogement } from "@/lib/actions/finances";

export const metadata = { title: "Finances" };

// Revalidate every 60 seconds
export const revalidate = 60;

interface FinancesPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function FinancesPage({ searchParams }: FinancesPageProps) {
  await requireProfile();
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

  // Get financial data
  const summary = await getFinancialSummary(startDate, endDate);
  const revenusByLogement = await getRevenusByLogement(startDate, endDate);

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
        <DateFilter />
      </div>

      {/* KPIs financiers */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="CA Brut"
          value={`${summary.revenusBrut.toFixed(0)}€`}
          description="Revenus total réservations"
          icon={DollarSign}
        />
        <KpiCard
          title="Commissions"
          value={`${summary.commissions.toFixed(0)}€`}
          description="Commissions conciergerie"
          icon={TrendingUp}
        />
        <KpiCard
          title="Charges"
          value={`${summary.charges.toFixed(0)}€`}
          description="Coûts incidents & factures"
          icon={TrendingDown}
        />
        <KpiCard
          title="Marge nette"
          value={`${summary.marge.toFixed(0)}€`}
          description={summary.marge >= 0 ? "Positif" : "Négatif"}
          icon={PiggyBank}
        />
      </div>

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
                        {item.total_brut.toFixed(0)}€
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {item.total_commissions.toFixed(0)}€
                        <span className="text-xs ml-1">
                          ({item.taux_moyen.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium text-green-600">
                        {item.total_net.toFixed(0)}€
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
                      {revenusByLogement
                        .reduce((sum, i) => sum + i.total_brut, 0)
                        .toFixed(0)}
                      €
                    </td>
                    <td className="pt-3 text-right">
                      {revenusByLogement
                        .reduce((sum, i) => sum + i.total_commissions, 0)
                        .toFixed(0)}
                      €
                    </td>
                    <td className="pt-3 text-right text-green-600">
                      {revenusByLogement
                        .reduce((sum, i) => sum + i.total_net, 0)
                        .toFixed(0)}
                      €
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note pour Phase 3 */}
      <Card className="border-dashed">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            <strong>Phase 3:</strong> Gestion des factures prestataires et export
            comptable (CSV/PDF) à venir
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
