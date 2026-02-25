import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { getExchangeRates } from "@/lib/actions/exchange-rates";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRightLeft } from "lucide-react";
import { CURRENCY_LABELS } from "@/types/database";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function DevisesPage() {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) redirect("/dashboard");

  const result = await getExchangeRates();
  const rates = result.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/finances"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ArrowRightLeft className="h-6 w-6" />Taux de change</h1>
          <p className="text-sm text-muted-foreground">Gestion des taux de conversion</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Taux enregistrés</CardTitle></CardHeader>
        <CardContent>
          {rates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun taux de change enregistré. Tous les montants sont traités en EUR.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground">
                  <th className="text-left py-2">De</th>
                  <th className="text-left py-2">Vers</th>
                  <th className="text-right py-2">Taux</th>
                  <th className="text-left py-2">Date effective</th>
                </tr></thead>
                <tbody>
                  {rates.map((r: any) => (
                    <tr key={r.id} className="border-b">
                      <td className="py-2 font-medium">{CURRENCY_LABELS[r.from_currency as keyof typeof CURRENCY_LABELS] || r.from_currency}</td>
                      <td className="py-2">{CURRENCY_LABELS[r.to_currency as keyof typeof CURRENCY_LABELS] || r.to_currency}</td>
                      <td className="py-2 text-right font-mono">{Number(r.rate).toFixed(4)}</td>
                      <td className="py-2 text-muted-foreground">{format(new Date(r.effective_date), "d MMM yyyy", { locale: fr })}</td>
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
