"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createPricingSeason, updatePricingSeason } from "@/lib/actions/pricing";
import type { PricingSeason } from "@/types/database";
import { Plus, Pencil } from "lucide-react";

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

interface Props {
  logementId: string;
  season?: PricingSeason;
  onSuccess: () => void;
}

export function PricingSeasonForm({ logementId, season, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(season?.name ?? "");
  const [startMonth, setStartMonth] = useState<number>(season?.start_month ?? 1);
  const [endMonth, setEndMonth] = useState<number>(season?.end_month ?? 12);
  const [pricePerNight, setPricePerNight] = useState<string>(
    season?.price_per_night != null ? String(season.price_per_night) : ""
  );

  const isEdit = !!season;

  function resetForm() {
    if (!season) {
      setName("");
      setStartMonth(1);
      setEndMonth(12);
      setPricePerNight("");
    } else {
      setName(season.name);
      setStartMonth(season.start_month);
      setEndMonth(season.end_month);
      setPricePerNight(String(season.price_per_night));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const formData = {
      logement_id: logementId,
      name,
      start_month: startMonth,
      end_month: endMonth,
      price_per_night: parseFloat(pricePerNight) || 0,
    };

    try {
      const result = isEdit
        ? await updatePricingSeason(season!.id, formData)
        : await createPricingSeason(formData);

      if (!result.success) {
        toast.error(result.error ?? "Erreur");
        setLoading(false);
        return;
      }

      toast.success(result.message ?? "Enregistré avec succès");
      setOpen(false);
      resetForm();
      onSuccess();
    } catch (err) {
      toast.error((err as Error).message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" className="relative h-8 w-8 after:content-[''] after:absolute after:-inset-[6px]" aria-label="Modifier">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier" : "Ajouter"} une saison tarifaire</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifiez les informations de cette saison tarifaire."
              : "Définissez une période et un prix par nuit."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="season-name">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="season-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Haute saison été"
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mois de début</Label>
              <Select
                value={String(startMonth)}
                onValueChange={(v) => setStartMonth(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FRENCH_MONTHS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mois de fin</Label>
              <Select
                value={String(endMonth)}
                onValueChange={(v) => setEndMonth(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FRENCH_MONTHS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price-per-night">
              Prix par nuit (EUR) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="price-per-night"
              type="number"
              step="0.01"
              min="0"
              max="100000"
              value={pricePerNight}
              onChange={(e) => setPricePerNight(e.target.value)}
              required
              placeholder="0.00"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Enregistrement..."
              : isEdit
              ? "Mettre à jour"
              : "Ajouter la saison"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
