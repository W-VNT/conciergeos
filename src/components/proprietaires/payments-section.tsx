"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Banknote, ChevronDown, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { OwnerPayment, OwnerPaymentStatus } from "@/types/database";
import { OWNER_PAYMENT_STATUS_LABELS } from "@/types/database";
import { getOwnerPaymentsForProprietaire, markOwnerPaymentPaid, deleteOwnerPayment } from "@/lib/actions/owner-payments";
import { formatCurrency } from "@/lib/format-currency";
import { CreateOwnerPaymentDialog } from "./create-owner-payment-dialog";

const STATUS_COLORS: Record<OwnerPaymentStatus, string> = {
  DU: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  PAYE: "bg-green-500/15 text-green-700 dark:text-green-300",
  PARTIEL: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  EN_RETARD: "bg-red-500/15 text-red-700 dark:text-red-300",
};

interface Props {
  proprietaireId: string;
}

export function PaymentsSection({ proprietaireId }: Props) {
  const [payments, setPayments] = useState<OwnerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    const data = await getOwnerPaymentsForProprietaire(proprietaireId);
    setPayments(data);
    setLoading(false);
  }, [proprietaireId]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  async function handleMarkPaid(paymentId: string, amount: number) {
    const result = await markOwnerPaymentPaid(paymentId, amount);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message ?? "Paiement marqué comme payé");
      loadPayments();
    }
  }

  async function handleDelete(paymentId: string) {
    const result = await deleteOwnerPayment(paymentId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message ?? "Paiement supprimé");
      loadPayments();
    }
    setDeleteConfirmId(null);
  }

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
                <Banknote className="h-5 w-5" />
                Paiements
              </CardTitle>
              <CardDescription>
                {payments.length} paiement{payments.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                collapsed ? "-rotate-90" : ""
              }`}
            />
          </button>
          <CreateOwnerPaymentDialog
            proprietaires={[]}
            defaultProprietaireId={proprietaireId}
            onCreated={loadPayments}
          />
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">
              Chargement...
            </p>
          ) : payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun paiement enregistré.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-2 font-medium">Période</th>
                    <th className="pb-2 font-medium text-right">Montant</th>
                    <th className="pb-2 font-medium text-right">Payé</th>
                    <th className="pb-2 font-medium">Statut</th>
                    <th className="pb-2 font-medium">Date paiement</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const period =
                      payment.period_start && payment.period_end
                        ? `${new Date(payment.period_start).toLocaleDateString("fr-FR")} — ${new Date(payment.period_end).toLocaleDateString("fr-FR")}`
                        : payment.period_start
                        ? new Date(payment.period_start).toLocaleDateString("fr-FR")
                        : "—";

                    return (
                      <tr
                        key={payment.id}
                        className="border-b last:border-0 hover:bg-muted/50"
                      >
                        <td className="py-2 whitespace-nowrap">{period}</td>
                        <td className="py-2 text-right font-medium whitespace-nowrap">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-2 text-right whitespace-nowrap">
                          {formatCurrency(payment.paid_amount)}
                        </td>
                        <td className="py-2">
                          <Badge
                            variant="secondary"
                            className={
                              STATUS_COLORS[payment.status as OwnerPaymentStatus] ??
                              "bg-muted text-muted-foreground"
                            }
                          >
                            {OWNER_PAYMENT_STATUS_LABELS[payment.status as OwnerPaymentStatus]}
                          </Badge>
                        </td>
                        <td className="py-2 whitespace-nowrap text-muted-foreground">
                          {payment.paid_at
                            ? new Date(payment.paid_at).toLocaleDateString("fr-FR")
                            : "—"}
                        </td>
                        <td className="py-2">
                          <div className="flex items-center justify-end gap-1">
                            {(payment.status === "DU" || payment.status === "EN_RETARD") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-green-600"
                                title="Marquer payé"
                                onClick={() => handleMarkPaid(payment.id, payment.amount)}
                              >
                                <Banknote className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-600"
                              title="Supprimer"
                              onClick={() => setDeleteConfirmId(payment.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      )}

      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce paiement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteConfirmId) handleDelete(deleteConfirmId);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
