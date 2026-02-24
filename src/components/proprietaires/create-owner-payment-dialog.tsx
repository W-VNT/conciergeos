"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createOwnerPayment } from "@/lib/actions/owner-payments";

interface Props {
  proprietaires: { id: string; full_name: string }[];
  defaultProprietaireId?: string;
  onCreated?: () => void;
}

export function CreateOwnerPaymentDialog({ proprietaires, defaultProprietaireId, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [proprietaireId, setProprietaireId] = useState(defaultProprietaireId ?? "");
  const [amount, setAmount] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await createOwnerPayment({
      proprietaire_id: proprietaireId,
      contrat_id: "",
      amount: Number(amount),
      period_start: periodStart,
      period_end: periodEnd,
      notes,
    });

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message ?? "Paiement créé");
      setOpen(false);
      setAmount("");
      setPeriodStart("");
      setPeriodEnd("");
      setNotes("");
      if (!defaultProprietaireId) setProprietaireId("");
      onCreated?.();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau paiement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau paiement propriétaire</DialogTitle>
          <DialogDescription>
            Créez un paiement dû à un propriétaire.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!defaultProprietaireId && (
            <div className="space-y-2">
              <Label>Propriétaire</Label>
              <Select value={proprietaireId} onValueChange={setProprietaireId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un propriétaire" />
                </SelectTrigger>
                <SelectContent>
                  {proprietaires.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Montant (EUR)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Début de période</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fin de période</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Commentaires..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || !proprietaireId || !amount}>
            {loading ? "Création en cours..." : "Créer le paiement"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
