"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Coins, Trash2 } from "lucide-react";
import { getPricingSeasons, deletePricingSeason } from "@/lib/actions/pricing";
import { PricingSeasonForm } from "@/components/logements/pricing-season-form";
import { formatCurrencyDecimals } from "@/lib/format-currency";
import type { PricingSeason } from "@/types/database";

const FRENCH_MONTHS: Record<number, string> = {
  1: "Janvier",
  2: "Février",
  3: "Mars",
  4: "Avril",
  5: "Mai",
  6: "Juin",
  7: "Juillet",
  8: "Août",
  9: "Septembre",
  10: "Octobre",
  11: "Novembre",
  12: "Décembre",
};

function isCurrentMonthInSeason(startMonth: number, endMonth: number): boolean {
  const currentMonth = new Date().getMonth() + 1;
  if (startMonth <= endMonth) {
    return currentMonth >= startMonth && currentMonth <= endMonth;
  }
  // Wrap-around (e.g., Nov-Feb)
  return currentMonth >= startMonth || currentMonth <= endMonth;
}

function formatMonthRange(startMonth: number, endMonth: number): string {
  return `${FRENCH_MONTHS[startMonth]} — ${FRENCH_MONTHS[endMonth]}`;
}

interface Props {
  logementId: string;
  isAdmin: boolean;
}

export function PricingSeasonSection({ logementId, isAdmin }: Props) {
  const [seasons, setSeasons] = useState<PricingSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadSeasons = useCallback(async () => {
    setLoading(true);
    const result = await getPricingSeasons(logementId);
    if (result.success && result.data) {
      setSeasons(result.data.seasons);
    }
    setLoading(false);
  }, [logementId]);

  useEffect(() => {
    loadSeasons();
  }, [loadSeasons]);

  async function handleDelete(id: string) {
    const result = await deletePricingSeason(id);
    if (!result.success) {
      toast.error(result.error ?? "Erreur");
    } else {
      toast.success(result.message ?? "Supprimé");
      loadSeasons();
    }
    setDeleteConfirmId(null);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Tarification saisonnière
            </CardTitle>
            <CardDescription>
              {seasons.length} saison{seasons.length > 1 ? "s" : ""} tarifaire{seasons.length > 1 ? "s" : ""}
            </CardDescription>
          </div>
          {isAdmin && (
            <PricingSeasonForm logementId={logementId} onSuccess={loadSeasons} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Chargement...</p>
        ) : seasons.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucune saison tarifaire définie.{" "}
            {isAdmin && "Cliquez sur \"Ajouter\" pour commencer."}
          </p>
        ) : (
          <div className="space-y-2">
            {seasons.map((season) => {
              const isCurrent = isCurrentMonthInSeason(season.start_month, season.end_month);
              return (
                <div
                  key={season.id}
                  className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 ${
                    isCurrent ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{season.name}</span>
                      {isCurrent && (
                        <Badge variant="default" className="text-xs">
                          En cours
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {formatMonthRange(season.start_month, season.end_month)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`font-semibold ${isCurrent ? "text-primary" : ""}`}>
                      {formatCurrencyDecimals(Number(season.price_per_night))}
                      <span className="text-xs font-normal text-muted-foreground"> / nuit</span>
                    </span>
                    {isAdmin && (
                      <>
                        <PricingSeasonForm
                          logementId={logementId}
                          season={season}
                          onSuccess={loadSeasons}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="relative h-8 w-8 after:content-[''] after:absolute after:-inset-[6px]"
                          onClick={() => setDeleteConfirmId(season.id)}
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
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

      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette saison tarifaire ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La saison tarifaire sera supprimée.
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
