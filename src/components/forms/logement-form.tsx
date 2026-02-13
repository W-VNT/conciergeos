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
import type { Logement, Proprietaire } from "@/types/database";

interface Props {
  logement?: Logement;
  proprietaires: Proprietaire[];
}

export function LogementForm({ logement, proprietaires }: Props) {
  const [loading, setLoading] = useState(false);
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
      offer_tier: logement?.offer_tier ?? "ESSENTIEL",
      lockbox_code: logement?.lockbox_code ?? "",
      wifi_name: logement?.wifi_name ?? "",
      wifi_password: logement?.wifi_password ?? "",
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
