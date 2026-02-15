"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { logementSchema, type LogementFormData } from "@/lib/schemas";
import { createLogement, updateLogement } from "@/lib/actions/logements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Loader2 } from "lucide-react";
import type { Logement, Proprietaire } from "@/types/database";
import { geocodeAddress, buildAddressString } from "@/lib/geocoding";

interface Props {
  logement?: Logement;
  proprietaires: Proprietaire[];
}

export function LogementForm({ logement, proprietaires }: Props) {
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
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
      notes: logement?.notes ?? "",
      status: logement?.status ?? "ACTIF",
    },
  });

  async function onSubmit(data: LogementFormData) {
    setLoading(true);
    try {
      if (isEdit) {
        await updateLogement(logement!.id, data);
      } else {
        await createLogement(data);
      }
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

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du logement *</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Propriétaire</Label>
              <Select
                defaultValue={form.getValues("owner_id") || "NONE"}
                onValueChange={(v) => form.setValue("owner_id", v === "NONE" ? "" : v)}
              >
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">— Aucun —</SelectItem>
                  {proprietaires.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_line1">Adresse</Label>
              <Input id="address_line1" {...form.register("address_line1")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" {...form.register("city")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Code postal</Label>
              <Input id="postal_code" {...form.register("postal_code")} />
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
              <Select
                defaultValue={form.getValues("offer_tier")}
                onValueChange={(v) => form.setValue("offer_tier", v as "ESSENTIEL" | "SERENITE" | "SIGNATURE")}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ESSENTIEL">Essentiel</SelectItem>
                  <SelectItem value="SERENITE">Sérénité</SelectItem>
                  <SelectItem value="SIGNATURE">Signature</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                defaultValue={form.getValues("status")}
                onValueChange={(v) => form.setValue("status", v as "ACTIF" | "PAUSE" | "ARCHIVE")}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIF">Actif</SelectItem>
                  <SelectItem value="PAUSE">En pause</SelectItem>
                  <SelectItem value="ARCHIVE">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="lockbox_code">Code boîte à clés</Label>
              <Input id="lockbox_code" {...form.register("lockbox_code")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wifi_name">WiFi (nom)</Label>
              <Input id="wifi_name" {...form.register("wifi_name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wifi_password">WiFi (mot de passe)</Label>
              <Input id="wifi_password" {...form.register("wifi_password")} />
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
            <Label htmlFor="ical_url">URL iCal (Airbnb, Booking.com...)</Label>
            <Input
              id="ical_url"
              type="url"
              {...form.register("ical_url")}
              placeholder="https://www.airbnb.com/calendar/ical/..."
            />
            <p className="text-sm text-muted-foreground">
              Pour synchroniser automatiquement les réservations depuis Airbnb, Booking.com, etc.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...form.register("notes")} />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
