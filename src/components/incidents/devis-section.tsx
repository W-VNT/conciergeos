"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Plus, Check, X } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format-currency";
import { DEVIS_STATUS_LABELS } from "@/types/database";
import type { DevisPrestataire, DevisStatus, Prestataire } from "@/types/database";
import {
  getDevisForIncident,
  createDevis,
  acceptDevis,
  refuseDevis,
} from "@/lib/actions/devis";

interface DevisSectionProps {
  incidentId: string;
  organisationId: string;
  prestataires: Prestataire[];
}

export function DevisSection({ incidentId, organisationId, prestataires }: DevisSectionProps) {
  const [devisList, setDevisList] = useState<DevisPrestataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [formPrestataireId, setFormPrestataireId] = useState("");
  const [formMontant, setFormMontant] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    loadDevis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDevis() {
    setLoading(true);
    const data = await getDevisForIncident(incidentId);
    setDevisList(data);
    setLoading(false);
  }

  function handleCreate() {
    if (!formPrestataireId) {
      toast.error("Veuillez sélectionner un prestataire");
      return;
    }
    const montant = parseFloat(formMontant);
    if (isNaN(montant) || montant <= 0) {
      toast.error("Montant invalide");
      return;
    }
    if (!formDescription.trim()) {
      toast.error("Description requise");
      return;
    }

    startTransition(async () => {
      const res = await createDevis({
        prestataire_id: formPrestataireId,
        incident_id: incidentId,
        mission_id: "",
        montant,
        description: formDescription.trim(),
        notes: formNotes.trim(),
        organisation_id: organisationId,
      });
      if (res.success) {
        toast.success(res.message);
        setDialogOpen(false);
        resetForm();
        await loadDevis();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleAccept(devisId: string) {
    startTransition(async () => {
      const res = await acceptDevis(devisId);
      if (res.success) {
        toast.success(res.message);
        await loadDevis();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleRefuse(devisId: string) {
    startTransition(async () => {
      const res = await refuseDevis(devisId);
      if (res.success) {
        toast.success(res.message);
        await loadDevis();
      } else {
        toast.error(res.error);
      }
    });
  }

  function resetForm() {
    setFormPrestataireId("");
    setFormMontant("");
    setFormDescription("");
    setFormNotes("");
  }

  function getStatusVariant(status: DevisStatus): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
      case "ACCEPTE":
        return "default";
      case "REFUSE":
        return "destructive";
      default:
        return "secondary";
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Devis
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Ajouter un devis
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un devis</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Prestataire *</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formPrestataireId}
                    onChange={(e) => setFormPrestataireId(e.target.value)}
                  >
                    <option value="">-- Sélectionner --</option>
                    {prestataires.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Montant (EUR) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formMontant}
                    onChange={(e) => setFormMontant(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Décrivez les travaux..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optionnel)</Label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Notes internes..."
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={isPending}
                  onClick={handleCreate}
                >
                  {isPending ? "Création..." : "Créer le devis"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : devisList.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun devis pour cet incident</p>
        ) : (
          <div className="space-y-3">
            {devisList.map((d) => {
              const prestataire = d.prestataire as { id: string; full_name: string } | null;
              return (
                <div
                  key={d.id}
                  className="flex items-start justify-between gap-4 p-3 border rounded-lg"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {formatCurrency(d.montant)}
                      </span>
                      <Badge variant={getStatusVariant(d.status as DevisStatus)}>
                        {DEVIS_STATUS_LABELS[d.status as DevisStatus]}
                      </Badge>
                    </div>
                    {prestataire && (
                      <p className="text-xs text-muted-foreground">
                        {prestataire.full_name}
                      </p>
                    )}
                    <p className="text-sm truncate">{d.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Soumis le {new Date(d.submitted_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  {d.status === "SOUMIS" && (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        disabled={isPending}
                        onClick={() => handleAccept(d.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accepter
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isPending}
                        onClick={() => handleRefuse(d.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Refuser
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
