"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Shield, Trash2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { deleteWarranty } from "@/lib/actions/warranties";
import { WARRANTY_TYPE_LABELS } from "@/types/database";
import { formatCurrency } from "@/lib/format-currency";
import type { Warranty } from "@/types/database";

interface Props {
  warranties: Warranty[];
}

export function WarrantiesSection({ warranties }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette garantie/assurance ?")) return;
    startTransition(async () => {
      await deleteWarranty(id);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Garanties & Assurances
        </CardTitle>
      </CardHeader>
      <CardContent>
        {warranties.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune garantie ou assurance enregistrée.</p>
        ) : (
          <div className="space-y-3">
            {warranties.map((w: any) => {
              const daysLeft = differenceInDays(new Date(w.end_date), new Date());
              const isExpiring = daysLeft <= (w.alert_days_before || 30);
              const isExpired = daysLeft < 0;
              return (
                <div key={w.id} className={`p-3 rounded-lg border ${isExpired ? "border-red-300 bg-red-50 dark:bg-red-950/20" : isExpiring ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusBadge value={w.type} label={WARRANTY_TYPE_LABELS[w.type as keyof typeof WARRANTY_TYPE_LABELS] || w.type} />
                      <span className="font-medium text-sm">{w.provider}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={isPending} onClick={() => handleDelete(w.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    {w.policy_number && <span>N° {w.policy_number}</span>}
                    <span>{format(new Date(w.start_date), "d MMM yyyy", { locale: fr })} — {format(new Date(w.end_date), "d MMM yyyy", { locale: fr })}</span>
                    {w.annual_cost && <span>{formatCurrency(w.annual_cost)}/an</span>}
                    <span className={isExpired ? "text-red-600 font-medium" : isExpiring ? "text-amber-600 font-medium" : ""}>
                      {isExpired ? "Expirée" : `${daysLeft}j restants`}
                    </span>
                  </div>
                  {w.coverage_details && <p className="mt-1 text-xs text-muted-foreground">{w.coverage_details}</p>}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
