import { getOwnerFinances } from "@/lib/actions/owner-portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Banknote, PiggyBank, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import { OwnerFinanceDashboard } from "@/components/owner/owner-finance-dashboard";

export default async function OwnerFinancesPage() {
  const finances = await getOwnerFinances();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mes finances</h1>
        <p className="text-muted-foreground mt-1">
          Suivi de vos revenus et commissions
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatCurrency(finances.totalCA)}</p>
                <p className="text-xs text-muted-foreground">CA Brut</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Receipt className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatCurrency(finances.totalCommissions)}</p>
                <p className="text-xs text-muted-foreground">Commissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <PiggyBank className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(finances.netRevenue)}
                </p>
                <p className="text-xs text-muted-foreground">Net proprietaire</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <Banknote className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-lg font-bold">{finances.nbReservations}</p>
                <p className="text-xs text-muted-foreground">Reservations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolution mensuelle</CardTitle>
        </CardHeader>
        <CardContent>
          <OwnerFinanceDashboard monthlyData={finances.monthlyData} />
        </CardContent>
      </Card>

      {/* Revenue by Logement */}
      <Card>
        <CardHeader>
          <CardTitle>Revenus par logement</CardTitle>
        </CardHeader>
        <CardContent>
          {finances.byLogement.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun revenu enregistre
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">
                      Logement
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">
                      Reservations
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">
                      CA Brut
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">
                      Commissions
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">
                      Net
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {finances.byLogement.map((row) => (
                    <tr key={row.logement_id} className="border-b last:border-0">
                      <td className="py-2.5 font-medium">{row.logement_name}</td>
                      <td className="py-2.5 text-right text-muted-foreground">
                        {row.nb_reservations}
                      </td>
                      <td className="py-2.5 text-right">
                        {formatCurrency(row.total_brut)}
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground">
                        {formatCurrency(row.total_commissions)}
                      </td>
                      <td className="py-2.5 text-right font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(row.total_net)}
                      </td>
                    </tr>
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
