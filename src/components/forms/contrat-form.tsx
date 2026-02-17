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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Contrat, Proprietaire, Logement } from "@/types/database";
import { CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS } from "@/types/database";

interface Props {
  contrat?: Contrat;
  proprietaires: Proprietaire[];
  logements: Logement[];
}

export function ContratForm({ contrat, proprietaires, logements }: Props) {
  const [loading, setLoading] = useState(false);
  const [proprioOpen, setPropioOpen] = useState(false);
  const [logementOpen, setLogementOpen] = useState(false);
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

  const proprioId = form.watch("proprietaire_id");
  const logementId = form.watch("logement_id");

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
          <div className="space-y-2">
            <Label>
              Propriétaire <span className="text-destructive">*</span>
            </Label>
            <Popover open={proprioOpen} onOpenChange={setPropioOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={proprioOpen}
                  className="w-full justify-between font-normal"
                >
                  {proprioId
                    ? proprietaires.find((p) => p.id === proprioId)?.full_name
                    : "Sélectionner un propriétaire"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Rechercher un propriétaire..." />
                  <CommandList>
                    <CommandEmpty>Aucun propriétaire trouvé</CommandEmpty>
                    <CommandGroup>
                      {proprietaires.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.full_name}
                          onSelect={() => {
                            form.setValue("proprietaire_id", p.id);
                            setPropioOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", proprioId === p.id ? "opacity-100" : "opacity-0")} />
                          {p.full_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {form.formState.errors.proprietaire_id && (
              <p className="text-destructive text-sm">
                {form.formState.errors.proprietaire_id.message}
              </p>
            )}
          </div>

          {/* Logement (optionnel) */}
          <div className="space-y-2">
            <Label>Logement <span className="text-muted-foreground text-sm font-normal">(optionnel)</span></Label>
            <Popover open={logementOpen} onOpenChange={setLogementOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={logementOpen}
                  className="w-full justify-between font-normal"
                >
                  {logementId
                    ? logements.find((l) => l.id === logementId)?.name
                    : "Tous les logements du propriétaire"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Rechercher un logement..." />
                  <CommandList>
                    <CommandEmpty>Aucun logement trouvé</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="tous"
                        onSelect={() => {
                          form.setValue("logement_id", "");
                          setLogementOpen(false);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", !logementId ? "opacity-100" : "opacity-0")} />
                        Tous les logements
                      </CommandItem>
                      {logements.map((l) => (
                        <CommandItem
                          key={l.id}
                          value={l.name}
                          onSelect={() => {
                            form.setValue("logement_id", l.id);
                            setLogementOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", logementId === l.id ? "opacity-100" : "opacity-0")} />
                          {l.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Type de contrat */}
          <div className="space-y-2">
            <Label>
              Type de contrat <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value) => form.setValue("type", value as "EXCLUSIF" | "SIMPLE")}
            >
              <SelectTrigger>
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
            <div className="space-y-2">
              <Label htmlFor="start_date">
                Date de début <span className="text-destructive">*</span>
              </Label>
              <Input
                id="start_date"
                type="date"
                {...form.register("start_date")}
              />
              {form.formState.errors.start_date && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.start_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">
                Date de fin <span className="text-destructive">*</span>
              </Label>
              <Input
                id="end_date"
                type="date"
                {...form.register("end_date")}
              />
              {form.formState.errors.end_date && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.end_date.message}
                </p>
              )}
            </div>
          </div>

          {/* Commission */}
          <div className="space-y-2">
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
              <p className="text-destructive text-sm">
                {form.formState.errors.commission_rate.message}
              </p>
            )}
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(value) => form.setValue("status", value as "ACTIF" | "EXPIRE" | "RESILIE")}
            >
              <SelectTrigger>
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
            <p className="text-muted-foreground text-sm">
              Le statut est automatiquement mis à jour en fonction des dates
            </p>
          </div>

          {/* Conditions */}
          <div className="space-y-2">
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
