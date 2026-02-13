"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { prestataireSchema, type PrestataireFormData } from "@/lib/schemas";
import { createPrestataire, updatePrestataire } from "@/lib/actions/prestataires";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import type { Prestataire } from "@/types/database";
import { SPECIALTY_LABELS } from "@/types/database";

export function PrestataireForm({ prestataire }: { prestataire?: Prestataire }) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!prestataire;

  const form = useForm<PrestataireFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(prestataireSchema) as any,
    defaultValues: {
      full_name: prestataire?.full_name ?? "",
      specialty: prestataire?.specialty ?? "AUTRE",
      phone: prestataire?.phone ?? "",
      email: prestataire?.email ?? "",
      zone: prestataire?.zone ?? "",
      hourly_rate: prestataire?.hourly_rate ?? null,
      reliability_score: prestataire?.reliability_score ?? null,
      notes: prestataire?.notes ?? "",
    },
  });

  async function onSubmit(data: PrestataireFormData) {
    setLoading(true);
    try {
      if (isEdit) { await updatePrestataire(prestataire!.id, data); }
      else { await createPrestataire(data); }
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
              <Label htmlFor="full_name">Nom complet *</Label>
              <Input id="full_name" {...form.register("full_name")} />
              {form.formState.errors.full_name && <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Spécialité</Label>
              <Select defaultValue={form.getValues("specialty")} onValueChange={(v) => form.setValue("specialty", v as PrestataireFormData["specialty"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(SPECIALTY_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="phone">Téléphone</Label><Input id="phone" {...form.register("phone")} /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" {...form.register("email")} /></div>
            <div className="space-y-2"><Label htmlFor="zone">Zone</Label><Input id="zone" {...form.register("zone")} /></div>
            <div className="space-y-2"><Label htmlFor="hourly_rate">Taux horaire (EUR)</Label><Input id="hourly_rate" type="number" step="0.01" {...form.register("hourly_rate")} /></div>
            <div className="space-y-2"><Label htmlFor="reliability_score">Fiabilité (1-5)</Label><Input id="reliability_score" type="number" min="1" max="5" {...form.register("reliability_score")} /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" {...form.register("notes")} /></div>
          <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
