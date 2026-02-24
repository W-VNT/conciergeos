"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { logementSchema, type LogementFormData } from "@/lib/schemas";
import { createLogement, updateLogement } from "@/lib/actions/logements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FormError } from "@/components/shared/form-error";
import { useState } from "react";
import { toast } from "sonner";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { TagInput } from "@/components/shared/tag-input";
import { MapPin, Loader2, ChevronsUpDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { Logement, Proprietaire } from "@/types/database";
import { geocodeAddress, buildAddressString } from "@/lib/geocoding";

interface Props {
  logement?: Logement;
  proprietaires: Proprietaire[];
}

export function LogementForm({ logement, proprietaires }: Props) {
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [proprioOpen, setPropioOpen] = useState(false);
  const router = useRouter();
  const isEdit = !!logement;

  const form = useForm<LogementFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(logementSchema) as any,
    defaultValues: {
      name: logement?.name ?? "",
      owner_id: logement?.owner_id ?? "",
      address_line1: logement?.address_line1 ?? "",
      city: logement?.city ?? "",
      postal_code: logement?.postal_code ?? "",
      country: logement?.country ?? "France",
      latitude: logement?.latitude ?? null,
      longitude: logement?.longitude ?? null,
      offer_tier: logement?.offer_tier ?? "ESSENTIEL",
      lockbox_code: logement?.lockbox_code ?? "",
      wifi_name: logement?.wifi_name ?? "",
      wifi_password: logement?.wifi_password ?? "",
      bedrooms: logement?.bedrooms ?? null,
      beds: logement?.beds ?? null,
      max_guests: logement?.max_guests ?? null,
      ical_url: logement?.ical_url ?? "",
      menage_price: logement?.menage_price ?? null,
      tags: logement?.tags ?? [],
      notes: logement?.notes ?? "",
      status: logement?.status ?? "ACTIF",
    },
  });
  useUnsavedChanges(form.formState.isDirty);

  async function onSubmit(data: LogementFormData) {
    setLoading(true);
    try {
      const result = isEdit
        ? await updateLogement(logement!.id, data)
        : await createLogement(data);

      if (!result.success) {
        toast.error(result.error ?? "Erreur");
        setLoading(false);
        return;
      }

      toast.success(result.message ?? "Enregistré avec succès");
      router.push(isEdit ? `/logements/${logement!.id}` : "/logements");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Erreur");
      setLoading(false);
    }
  }

  async function handleGeocode() {
    setGeocoding(true);

    try {
      const address = buildAddressString(
        form.getValues("address_line1"),
        form.getValues("postal_code"),
        form.getValues("city"),
        form.getValues("country")
      );

      if (!address || address.length < 3) {
        toast.error("Veuillez remplir au moins l'adresse ou la ville");
        setGeocoding(false);
        return;
      }

      const result = await geocodeAddress(address);

      if (!result) {
        toast.error("Adresse introuvable. Vérifiez l'adresse saisie.");
        setGeocoding(false);
        return;
      }

      // Update form values
      form.setValue("latitude", result.latitude);
      form.setValue("longitude", result.longitude);

      toast.success(`Coordonnées GPS trouvées!\n${result.place_name}`);
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Erreur lors de la géolocalisation");
    } finally {
      setGeocoding(false);
    }
  }

  const ownerId = form.watch("owner_id");

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du logement *</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <FormError message={form.formState.errors.name.message} />
              )}
            </div>
            <div className="space-y-2">
              <Label>Propriétaire</Label>
              <Popover open={proprioOpen} onOpenChange={setPropioOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={proprioOpen}
                    aria-label="Sélectionner un propriétaire"
                    className="w-full justify-between font-normal"
                  >
                    {ownerId
                      ? proprietaires.find((p) => p.id === ownerId)?.full_name
                      : "— Aucun —"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Rechercher un propriétaire..." />
                    <CommandList>
                      <CommandEmpty>Aucun propriétaire trouvé.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value=""
                          onSelect={() => { form.setValue("owner_id", ""); setPropioOpen(false); }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", !ownerId ? "opacity-100" : "opacity-0")} />
                          — Aucun —
                        </CommandItem>
                        {proprietaires.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={p.full_name}
                            onSelect={() => { form.setValue("owner_id", p.id); setPropioOpen(false); }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", ownerId === p.id ? "opacity-100" : "opacity-0")} />
                            {p.full_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_line1">Adresse</Label>
              <Input id="address_line1" {...form.register("address_line1")} />
              {form.formState.errors.address_line1 && (
                <FormError message={form.formState.errors.address_line1.message} />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" {...form.register("city")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Code postal</Label>
              <Input id="postal_code" inputMode="numeric" {...form.register("postal_code")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Input id="country" {...form.register("country")} />
            </div>
          </div>

          {/* GPS Coordinates */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">Coordonnées GPS</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGeocode}
                disabled={geocoding}
              >
                {geocoding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Géolocalisation...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Géolocaliser automatiquement
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Remplissez l'adresse ci-dessus puis cliquez sur "Géolocaliser" pour obtenir automatiquement les coordonnées GPS.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  {...form.register("latitude")}
                  placeholder="Ex: 43.7102"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  {...form.register("longitude")}
                  placeholder="Ex: 7.2620"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Offre</Label>
              <Controller name="offer_tier" control={form.control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ESSENTIEL">Essentiel</SelectItem>
                    <SelectItem value="SERENITE">Sérénité</SelectItem>
                    <SelectItem value="SIGNATURE">Signature</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Controller name="status" control={form.control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIF">Actif</SelectItem>
                    <SelectItem value="PAUSE">En pause</SelectItem>
                    <SelectItem value="ARCHIVE">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="lockbox_code">Code boîte à clés</Label>
              <Input id="lockbox_code" {...form.register("lockbox_code")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wifi_name">Nom du WiFi</Label>
              <Input id="wifi_name" {...form.register("wifi_name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wifi_password">Mot de passe WiFi</Label>
              <Input id="wifi_password" type="text" autoComplete="off" {...form.register("wifi_password")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Nombre de chambres</Label>
              <Input
                id="bedrooms"
                type="number"
                min="0"
                {...form.register("bedrooms")}
                placeholder="Ex: 2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beds">Nombre de lits</Label>
              <Input
                id="beds"
                type="number"
                min="0"
                {...form.register("beds")}
                placeholder="Ex: 3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_guests">Capacité max (voyageurs)</Label>
              <Input
                id="max_guests"
                type="number"
                min="0"
                {...form.register("max_guests")}
                placeholder="Ex: 6"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="menage_price">Prix ménage (€)</Label>
            <Input
              id="menage_price"
              type="number"
              min="0"
              step="0.01"
              {...form.register("menage_price")}
              placeholder="Ex: 60"
            />
            {form.formState.errors.menage_price && (
              <FormError message={form.formState.errors.menage_price.message} />
            )}
            <p className="text-sm text-muted-foreground">
              Coût du ménage spécifique à ce logement. Laissez vide pour utiliser le tarif par défaut.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ical_url">URL iCal (Airbnb, Booking.com...)</Label>
            <Input
              id="ical_url"
              type="url"
              inputMode="url"
              {...form.register("ical_url")}
              placeholder="https://www.airbnb.com/calendar/ical/..."
            />
            {form.formState.errors.ical_url && (
              <FormError message={form.formState.errors.ical_url.message} />
            )}
            <p className="text-sm text-muted-foreground">
              Pour synchroniser automatiquement les réservations depuis Airbnb, Booking.com, etc.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...form.register("notes")} />
            {form.formState.errors.notes && (
              <FormError message={form.formState.errors.notes.message} />
            )}
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <Controller
              name="tags"
              control={form.control}
              render={({ field }) => (
                <TagInput value={field.value} onChange={field.onChange} />
              )}
            />
            {form.formState.errors.tags && (
              <FormError message={form.formState.errors.tags.message} />
            )}
          </div>
          <div className="sticky bottom-0 bg-background pt-3 pb-1 -mx-6 px-6 border-t md:static md:border-0 md:mx-0 md:px-0 md:pt-0 md:pb-0">
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
