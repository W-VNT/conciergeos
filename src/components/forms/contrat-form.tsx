"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contratSchema, type ContratFormData } from "@/lib/schemas";
import { createContrat, updateContrat } from "@/lib/actions/contrats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import type { Contrat, Proprietaire, Logement } from "@/types/database";
import { CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS } from "@/types/database";

interface Props {
  contrat?: Contrat;
  proprietaires: Proprietaire[];
  logements: Logement[];
}

export function ContratForm({ contrat, proprietaires, logements }: Props) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!contrat;

  const form = useForm<ContratFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(contratSchema) as any,
    defaultValues: {
      proprietaire_id: contrat?.proprietaire_id ?? "",
      logement_id: contrat?.logement_id ?? "",
      type: contrat?.type ?? "SIMPLE",
      start_date: contrat?.start_date ? new Date(contrat.start_date).toISOString().split('T')[0] : "",
      end_date: contrat?.end_date ? new Date(contrat.end_date).toISOString().split('T')[0] : "",
      commission_rate: contrat?.commission_rate ?? 20,
      status: contrat?.status ?? "ACTIF",
      conditions: contrat?.conditions ?? "",
    },
  });

  async function onSubmit(data: ContratFormData) {
    setLoading(true);
    try {
      if (isEdit) {
        await updateContrat(contrat!.id, data);
      } else {
        await createContrat(data);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Erreur");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-lg mb-4">Informations générales</h3>

          {/* Propriétaire */}
          <div>
            <Label htmlFor="proprietaire_id">
              Propriétaire <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.watch("proprietaire_id")}
              onValueChange={(value) => form.setValue("proprietaire_id", value)}
            >
              <SelectTrigger id="proprietaire_id">
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
            {form.formState.errors.proprietaire_id && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.proprietaire_id.message}
              </p>
            )}
          </div>

          {/* Logement (optionnel) */}
          <div>
            <Label htmlFor="logement_id">Logement</Label>
            <Select
              value={form.watch("logement_id")}
              onValueChange={(value) => form.setValue("logement_id", value)}
            >
              <SelectTrigger id="logement_id">
                <SelectValue placeholder="Tous les logements (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les logements</SelectItem>
                {logements.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-sm mt-1">
              Laissez vide si le contrat couvre tous les logements du propriétaire
            </p>
          </div>

          {/* Type de contrat */}
          <div>
            <Label htmlFor="type">
              Type de contrat <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value) => form.setValue("type", value as "EXCLUSIF" | "SIMPLE")}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">
                Date de début <span className="text-destructive">*</span>
              </Label>
              <Input
                id="start_date"
                type="date"
                {...form.register("start_date")}
              />
              {form.formState.errors.start_date && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.start_date.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="end_date">
                Date de fin <span className="text-destructive">*</span>
              </Label>
              <Input
                id="end_date"
                type="date"
                {...form.register("end_date")}
              />
              {form.formState.errors.end_date && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.end_date.message}
                </p>
              )}
            </div>
          </div>

          {/* Commission */}
          <div>
            <Label htmlFor="commission_rate">
              Taux de commission (%) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="commission_rate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              {...form.register("commission_rate")}
            />
            {form.formState.errors.commission_rate && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.commission_rate.message}
              </p>
            )}
          </div>

          {/* Statut */}
          <div>
            <Label htmlFor="status">Statut</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(value) => form.setValue("status", value as "ACTIF" | "EXPIRE" | "RESILIE")}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONTRACT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-sm mt-1">
              Le statut est automatiquement mis à jour en fonction des dates
            </p>
          </div>

          {/* Conditions */}
          <div>
            <Label htmlFor="conditions">Conditions particulières</Label>
            <Textarea
              id="conditions"
              rows={4}
              placeholder="Conditions spécifiques du contrat..."
              {...form.register("conditions")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer le contrat"}
        </Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
