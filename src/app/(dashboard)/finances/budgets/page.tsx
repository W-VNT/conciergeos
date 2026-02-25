import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { getBudgetVsActual, getForecast } from "@/lib/actions/budgets";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, PiggyBank, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";

const MONTH_NAMES = ["", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export default async function BudgetsPage() {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) redirect("/dashboard");

  const year = new Date().getFullYear();
  const [comparison, forecastData] = await Promise.all([
    getBudgetVsActual(year),
    getForecast(6),
  ]);

  const totalBudget = comparison.reduce((s, c) => s + c.budget, 0);
  const totalActual = comparison.reduce((s, c) => s + c.actual_revenus, 0);
  const totalVariance = totalActual - totalBudget;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/finances"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><PiggyBank className="h-6 w-6" />Budget &amp; Prévisions &mdash; {year}</h1>
          <p className="text-sm text-muted-foreground">Comparaison budget vs réalisé</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Budget total</p><p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Réalisé total</p><p className="text-2xl font-bold">{formatCurrency(totalActual)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Variance</p><p className={`text-2xl font-bold ${totalVariance >= 0 ? "text-green-600" : "text-red-600"}`}>{totalVariance >= 0 ? "+" : ""}{formatCurrency(totalVariance)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Détail mensuel</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground">
                <th className="text-left py-2">Mois</th>
                <th className="text-right py-2">Budget</th>
                <th className="text-right py-2">Revenus</th>
                <th className="text-right py-2">Charges</th>
                <th className="text-right py-2">Variance</th>
              </tr></thead>
              <tbody>
                {comparison.map((c) => (
                  <tr key={c.month} className="border-b">
                    <td className="py-2 font-medium">{MONTH_NAMES[c.month]}</td>
                    <td className="py-2 text-right">{c.budget ? formatCurrency(c.budget) : <span className="text-muted-foreground">{"\u2014"}</span>}</td>
                    <td className="py-2 text-right">{formatCurrency(c.actual_revenus)}</td>
                    <td className="py-2 text-right text-red-600">{c.actual_charges > 0 ? `-${formatCurrency(c.actual_charges)}` : "\u2014"}</td>
                    <td className={`py-2 text-right font-medium ${c.variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {c.budget > 0 ? `${c.variance >= 0 ? "+" : ""}${formatCurrency(c.variance)}` : "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />Prévisions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Basé sur la moyenne des 6 derniers mois : <span className="font-medium">{formatCurrency(forecastData.avgMonthly)}/mois</span></p>
          <div className="grid gap-2 sm:grid-cols-3">
            {forecastData.forecast.map((f) => (
              <div key={`${f.year}-${f.month}`} className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{MONTH_NAMES[f.month]} {f.year}</p>
                <p className="text-lg font-semibold">{formatCurrency(f.projected)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
