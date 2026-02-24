"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { FormError } from "@/components/shared/form-error";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Contrat, Proprietaire, Logement, OfferTier } from "@/types/database";
import { CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS, OFFER_TIER_LABELS } from "@/types/database";

interface OfferConfig {
  tier: OfferTier;
  commission_rate: number;
  name: string;
}

interface Props {
  contrat?: Contrat;
  proprietaires: Proprietaire[];
  logements: Logement[];
  offerConfigs?: OfferConfig[];
}

export function ContratForm({ contrat, proprietaires, logements, offerConfigs = [] }: Props) {
  const [loading, setLoading] = useState(false);
  const [proprioOpen, setPropioOpen] = useState(false);
  const [logementOpen, setLogementOpen] = useState(false);
  const router = useRouter();
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
      status: contrat?.status === "SIGNE" ? "ACTIF" : (contrat?.status ?? "ACTIF"),
      conditions: contrat?.conditions ?? "",
      auto_renew: contrat?.auto_renew ?? false,
      renewal_duration_months: contrat?.renewal_duration_months ?? 12,
    },
  });
  useUnsavedChanges(form.formState.isDirty);

  const proprioId = form.watch("proprietaire_id");
  const logementId = form.watch("logement_id");
  const autoRenew = form.watch("auto_renew");

  // Auto-fill commission_rate from logement's offer tier (new contrats only)
  useEffect(() => {
    if (isEdit || !logementId) return;
    const logement = logements.find((l) => l.id === logementId);
    if (!logement) return;
    const config = offerConfigs.find((c) => c.tier === logement.offer_tier);
    if (config) {
      form.setValue("commission_rate", config.commission_rate);
    }
  }, [logementId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedLogement = logements.find((l) => l.id === logementId);
  const offerHint = selectedLogement
    ? offerConfigs.find((c) => c.tier === selectedLogement.offer_tier)
    : null;

  async function onSubmit(data: ContratFormData) {
    setLoading(true);
    try {
      const result = isEdit
        ? await updateContrat(contrat!.id, data)
        : await createContrat(data);

      if (!result.success) {
        toast.error(result.error ?? "Erreur");
        setLoading(false);
        return;
      }

      toast.success(result.message ?? "Enregistré avec succès");
      router.push(isEdit ? `/contrats/${contrat!.id}` : "/contrats");
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
              <FormError message={form.formState.errors.proprietaire_id.message} />
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
            <Controller name="type" control={form.control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
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
            )} />
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
                <FormError message={form.formState.errors.start_date.message} />
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
                <FormError message={form.formState.errors.end_date.message} />
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
            {offerHint ? (
              <p className="text-muted-foreground text-xs">
                Offre <strong>{offerHint.name}</strong> · taux par défaut {offerHint.commission_rate}% · modifiable
              </p>
            ) : (
              !logementId && (
                <p className="text-muted-foreground text-xs">
                  Sélectionnez un logement pour pré-remplir depuis son offre
                </p>
              )
            )}
            {form.formState.errors.commission_rate && (
              <FormError message={form.formState.errors.commission_rate.message} />
            )}
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label>Statut</Label>
            <Controller name="status" control={form.control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTRACT_STATUS_LABELS)
                    .filter(([value]) => value !== "SIGNE")
                    .map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
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

          {/* Reconduction automatique */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center space-x-3">
              <Controller
                name="auto_renew"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    id="auto_renew"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="auto_renew" className="cursor-pointer">
                Reconduction automatique (tacite reconduction)
              </Label>
            </div>
            {autoRenew && (
              <div className="space-y-2 pl-7">
                <Label htmlFor="renewal_duration_months">
                  Durée de reconduction (mois)
                </Label>
                <Input
                  id="renewal_duration_months"
                  type="number"
                  min="1"
                  max="120"
                  {...form.register("renewal_duration_months")}
                  className="w-40"
                />
                <p className="text-muted-foreground text-xs">
                  Le contrat sera automatiquement reconduit de cette durée à son échéance.
                  Une notification sera envoyée 30, 14 et 7 jours avant l'expiration.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="sticky bottom-0 bg-background pt-3 pb-1 border-t md:static md:border-0 md:pt-0 md:pb-0">
        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1 md:flex-none">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer le contrat"}
          </Button>
          <Button type="button" variant="outline" onClick={() => window.history.back()} className="flex-1 md:flex-none">
            Annuler
          </Button>
        </div>
      </div>
    </form>
  );
}
