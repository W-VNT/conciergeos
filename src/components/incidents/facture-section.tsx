"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, CheckCircle, CreditCard, X } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format-currency";
import { FACTURE_STATUS_LABELS } from "@/types/database";
import type { FacturePrestataire, FactureStatus } from "@/types/database";
import {
  getFacturesForPrestataire,
  getFacturesForIncident,
  validateFacture,
  markFacturePaid,
  refuseFacture,
} from "@/lib/actions/factures-prestataires";

interface FactureSectionProps {
  incidentId?: string;
  prestataireId?: string;
  organisationId: string;
}

export function FactureSection({ incidentId, prestataireId, organisationId }: FactureSectionProps) {
  const [factures, setFactures] = useState<FacturePrestataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadFactures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadFactures() {
    setLoading(true);
    let data: FacturePrestataire[] = [];
    if (incidentId) {
      data = await getFacturesForIncident(incidentId);
    } else if (prestataireId) {
      data = await getFacturesForPrestataire(prestataireId);
    }
    setFactures(data);
    setLoading(false);
  }

  function handleValidate(factureId: string) {
    startTransition(async () => {
      const res = await validateFacture(factureId);
      if (res.success) {
        toast.success(res.message);
        await loadFactures();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleMarkPaid(factureId: string) {
    startTransition(async () => {
      const res = await markFacturePaid(factureId);
      if (res.success) {
        toast.success(res.message);
        await loadFactures();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleRefuse(factureId: string) {
    startTransition(async () => {
      const res = await refuseFacture(factureId);
      if (res.success) {
        toast.success(res.message);
        await loadFactures();
      } else {
        toast.error(res.error);
      }
    });
  }

  function getStatusVariant(status: FactureStatus): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
      case "PAYEE":
        return "default";
      case "VALIDEE":
        return "secondary";
      case "REFUSEE":
        return "destructive";
      default:
        return "outline";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Factures
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : factures.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune facture</p>
        ) : (
          <div className="space-y-3">
            {factures.map((f) => {
              const prestataire = f.prestataire as { id: string; full_name: string } | null;
              return (
                <div
                  key={f.id}
                  className="flex items-start justify-between gap-4 p-3 border rounded-lg"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {formatCurrency(f.montant)}
                      </span>
                      <Badge variant={getStatusVariant(f.status as FactureStatus)}>
                        {FACTURE_STATUS_LABELS[f.status as FactureStatus]}
                      </Badge>
                    </div>
                    {f.numero_facture && (
                      <p className="text-xs text-muted-foreground">
                        N° {f.numero_facture}
                      </p>
                    )}
                    {prestataire && (
                      <p className="text-xs text-muted-foreground">
                        {prestataire.full_name}
                      </p>
                    )}
                    {f.description && (
                      <p className="text-sm truncate">{f.description}</p>
                    )}
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>
                        Emission : {new Date(f.date_emission).toLocaleDateString("fr-FR")}
                      </span>
                      {f.date_echeance && (
                        <span>
                          Echéance : {new Date(f.date_echeance).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                      {f.date_paiement && (
                        <span>
                          Payée le : {new Date(f.date_paiement).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 flex-wrap">
                    {f.status === "ATTENTE" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => handleValidate(f.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Valider
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isPending}
                          onClick={() => handleRefuse(f.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Refuser
                        </Button>
                      </>
                    )}
                    {f.status === "VALIDEE" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          disabled={isPending}
                          onClick={() => handleMarkPaid(f.id)}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Marquer payée
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isPending}
                          onClick={() => handleRefuse(f.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Refuser
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
