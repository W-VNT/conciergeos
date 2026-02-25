import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { getPlatformPayments, getReconciliationSummary } from "@/lib/actions/reconciliation";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Scale } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import { StatusBadge } from "@/components/shared/status-badge";
import { BOOKING_PLATFORM_LABELS, RECONCILIATION_STATUS_LABELS } from "@/types/database";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function ReconciliationPage() {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) redirect("/dashboard");

  const [paymentsResult, summary] = await Promise.all([
    getPlatformPayments(),
    getReconciliationSummary(),
  ]);
  const payments = paymentsResult.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/finances"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Scale className="h-6 w-6" />Réconciliation plateformes</h1>
          <p className="text-sm text-muted-foreground">Rapprochement des paiements reçus avec les réservations</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total paiements</p><p className="text-2xl font-bold">{summary.total}</p><p className="text-xs text-muted-foreground">{formatCurrency(summary.totalAmount)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Rapprochés</p><p className="text-2xl font-bold text-green-600">{summary.matched}</p><p className="text-xs text-muted-foreground">{formatCurrency(summary.matchedAmount)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Non rapprochés</p><p className="text-2xl font-bold text-amber-600">{summary.unmatched}</p><p className="text-xs text-muted-foreground">{formatCurrency(summary.unmatchedAmount)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Écarts</p><p className="text-2xl font-bold text-red-600">{summary.ecart}</p><p className="text-xs text-muted-foreground">{formatCurrency(summary.ecartAmount)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Paiements</CardTitle></CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun paiement enregistré.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Plateforme</th>
                  <th className="text-left py-2">Référence</th>
                  <th className="text-right py-2">Montant</th>
                  <th className="text-left py-2">Réservation</th>
                  <th className="text-left py-2">Statut</th>
                </tr></thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr key={p.id} className="border-b">
                      <td className="py-2">{format(new Date(p.payment_date), "d MMM yyyy", { locale: fr })}</td>
                      <td className="py-2">{BOOKING_PLATFORM_LABELS[p.platform as keyof typeof BOOKING_PLATFORM_LABELS] || p.platform}</td>
                      <td className="py-2 text-muted-foreground">{p.reference || "\u2014"}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(p.amount)}</td>
                      <td className="py-2">{p.reservation ? (
                        <Link href={`/reservations/${p.reservation.id}`} className="text-primary hover:underline">{p.reservation.guest_name}</Link>
                      ) : <span className="text-muted-foreground">{"\u2014"}</span>}</td>
                      <td className="py-2"><StatusBadge value={p.reconciliation_status} label={RECONCILIATION_STATUS_LABELS[p.reconciliation_status as keyof typeof RECONCILIATION_STATUS_LABELS] || p.reconciliation_status} /></td>
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
