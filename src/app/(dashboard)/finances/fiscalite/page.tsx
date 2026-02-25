import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { getTvaConfigs, getTvaSummary } from "@/lib/actions/tva";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";

export default async function FiscalitePage() {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) redirect("/dashboard");

  const year = new Date().getFullYear();
  const [configsResult, summary] = await Promise.all([
    getTvaConfigs(),
    getTvaSummary(`${year}-01-01`, `${year}-12-31`),
  ]);
  const configs = configsResult.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/finances"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Receipt className="h-6 w-6" />Fiscalité &amp; TVA &mdash; {year}</h1>
          <p className="text-sm text-muted-foreground">Configuration TVA et résumé fiscal</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total HT</p><p className="text-2xl font-bold">{formatCurrency(summary.totalHT)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total TVA</p><p className="text-2xl font-bold">{formatCurrency(summary.totalTVA)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total TTC</p><p className="text-2xl font-bold">{formatCurrency(summary.totalTTC)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Taux TVA configurés</CardTitle></CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun taux TVA configuré.</p>
          ) : (
            <div className="space-y-2">
              {configs.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{c.label}</p>
                    {c.is_default && <span className="text-xs text-primary font-medium">Par défaut</span>}
                  </div>
                  <p className="text-lg font-semibold">{c.rate}%</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {summary.byRate.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Détail par taux</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground">
                <th className="text-left py-2">Taux</th>
                <th className="text-right py-2">Base HT</th>
                <th className="text-right py-2">TVA</th>
                <th className="text-right py-2">Nb revenus</th>
              </tr></thead>
              <tbody>
                {summary.byRate.map((r: any) => (
                  <tr key={r.rate} className="border-b">
                    <td className="py-2 font-medium">{r.rate}%</td>
                    <td className="py-2 text-right">{formatCurrency(r.ht)}</td>
                    <td className="py-2 text-right">{formatCurrency(r.tva)}</td>
                    <td className="py-2 text-right">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
