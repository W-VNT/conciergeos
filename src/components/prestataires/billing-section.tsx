"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, ChevronDown, ExternalLink } from "lucide-react";
import type { FacturePrestataire, FactureStatus } from "@/types/database";
import { FACTURE_STATUS_LABELS } from "@/types/database";
import { getFacturesForPrestataire } from "@/lib/actions/factures-prestataires";
import { formatCurrency } from "@/lib/format-currency";
import Link from "next/link";

const STATUS_COLORS: Record<FactureStatus, string> = {
  ATTENTE: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  VALIDEE: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  PAYEE: "bg-green-500/15 text-green-700 dark:text-green-300",
  REFUSEE: "bg-red-500/15 text-red-700 dark:text-red-300",
};

interface Props {
  prestataireId: string;
}

export function BillingSection({ prestataireId }: Props) {
  const [factures, setFactures] = useState<FacturePrestataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const loadFactures = useCallback(async () => {
    setLoading(true);
    const data = await getFacturesForPrestataire(prestataireId);
    setFactures(data);
    setLoading(false);
  }, [prestataireId]);

  useEffect(() => {
    loadFactures();
  }, [loadFactures]);

  // Compute KPIs
  const totalFacture = factures.reduce((sum, f) => sum + f.montant, 0);
  const totalAttente = factures
    .filter((f) => f.status === "ATTENTE" || f.status === "VALIDEE")
    .reduce((sum, f) => sum + f.montant, 0);
  const totalPaye = factures
    .filter((f) => f.status === "PAYEE")
    .reduce((sum, f) => sum + f.montant, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-2 text-left"
          >
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Facturation
              </CardTitle>
              <CardDescription>
                {factures.length} facture{factures.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                collapsed ? "-rotate-90" : ""
              }`}
            />
          </button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/factures?q=${encodeURIComponent("")}`}>
              Toutes les factures
              <ExternalLink className="h-3 w-3 ml-2" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">
              Chargement...
            </p>
          ) : (
            <>
              {/* KPI mini-cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total facturé</p>
                  <p className="text-lg font-semibold mt-1">
                    {formatCurrency(totalFacture)}
                  </p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">En attente</p>
                  <p className="text-lg font-semibold mt-1 text-yellow-600">
                    {formatCurrency(totalAttente)}
                  </p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Payé</p>
                  <p className="text-lg font-semibold mt-1 text-green-600">
                    {formatCurrency(totalPaye)}
                  </p>
                </div>
              </div>

              {/* Recent factures table */}
              {factures.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Aucune facture enregistrée.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="pb-2 font-medium">N°</th>
                        <th className="pb-2 font-medium text-right">Montant</th>
                        <th className="pb-2 font-medium">Statut</th>
                        <th className="pb-2 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {factures.slice(0, 10).map((facture) => (
                        <tr
                          key={facture.id}
                          className="border-b last:border-0 hover:bg-muted/50"
                        >
                          <td className="py-2">
                            <Link
                              href={`/factures/${facture.id}`}
                              className="font-medium hover:underline"
                            >
                              {facture.numero_facture || `#${facture.id.slice(0, 8)}`}
                            </Link>
                          </td>
                          <td className="py-2 text-right font-medium whitespace-nowrap">
                            {formatCurrency(facture.montant)}
                          </td>
                          <td className="py-2">
                            <Badge
                              variant="secondary"
                              className={
                                STATUS_COLORS[facture.status as FactureStatus] ??
                                "bg-muted text-muted-foreground"
                              }
                            >
                              {FACTURE_STATUS_LABELS[facture.status as FactureStatus]}
                            </Badge>
                          </td>
                          <td className="py-2 whitespace-nowrap text-muted-foreground">
                            {new Date(facture.date_emission).toLocaleDateString("fr-FR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {factures.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      {factures.length - 10} facture(s) supplémentaire(s) non affichée(s).
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
