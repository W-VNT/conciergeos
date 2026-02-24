"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { incidentSchema, type IncidentFormData } from "@/lib/schemas";
import { createIncident, updateIncident } from "@/lib/actions/incidents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FormError } from "@/components/shared/form-error";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import type { Incident, Logement, Prestataire } from "@/types/database";
import { INCIDENT_SEVERITY_LABELS, INCIDENT_STATUS_LABELS, INCIDENT_CATEGORY_LABELS } from "@/types/database";

interface Props {
  incident?: Incident;
  logements: Logement[];
  prestataires: Prestataire[];
  defaultLogementId?: string;
  defaultMissionId?: string;
  preGeneratedId?: string;
}

export function IncidentForm({ incident, logements, prestataires, defaultLogementId, defaultMissionId, preGeneratedId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isEdit = !!incident;

  const form = useForm<IncidentFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(incidentSchema) as any,
    defaultValues: {
      logement_id: incident?.logement_id ?? defaultLogementId ?? "",
      mission_id: incident?.mission_id ?? defaultMissionId ?? "",
      prestataire_id: incident?.prestataire_id ?? "",
      severity: incident?.severity ?? "MINEUR",
      status: incident?.status ?? "OUVERT",
      category: incident?.category ?? "AUTRE",
      description: incident?.description ?? "",
      cost: incident?.cost ?? null,
      notes: incident?.notes ?? "",
      expected_resolution_date: incident?.expected_resolution_date ?? "",
    },
  });
  useUnsavedChanges(form.formState.isDirty);

  async function onSubmit(data: IncidentFormData) {
    setLoading(true);
    try {
      const result = isEdit
        ? await updateIncident(incident!.id, data)
        : await createIncident(data, preGeneratedId);

      if (!result.success) {
        toast.error(result.error ?? "Erreur");
        setLoading(false);
        return;
      }

      toast.success(result.message ?? "Enregistré avec succès");
      router.push(isEdit ? `/incidents/${incident!.id}` : "/incidents");
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
              <Label>Logement *</Label>
              <Controller name="logement_id" control={form.control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{logements.map((l) => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}</SelectContent>
                </Select>
              )} />
              {form.formState.errors.logement_id && <FormError message={form.formState.errors.logement_id.message} />}
            </div>
            <div className="space-y-2">
              <Label>Sévérité</Label>
              <Controller name="severity" control={form.control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(INCIDENT_SEVERITY_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Controller name="category" control={form.control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(INCIDENT_CATEGORY_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Controller name="status" control={form.control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(INCIDENT_STATUS_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>Prestataire</Label>
              <Controller name="prestataire_id" control={form.control} render={({ field }) => (
                <Select value={field.value || "NONE"} onValueChange={(v) => field.onChange(v === "NONE" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">— Aucun —</SelectItem>
                    {prestataires.map((p) => (<SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>))}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" rows={3} {...form.register("description")} />
              {form.formState.errors.description && <FormError message={form.formState.errors.description.message} />}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Coût (EUR)</Label>
              <Input id="cost" type="number" step="0.01" {...form.register("cost")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expected_resolution_date">Résolution prévue</Label>
              <Input id="expected_resolution_date" type="date" {...form.register("expected_resolution_date")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes / Suivi</Label>
              <Textarea id="notes" rows={3} placeholder="Ajoutez des informations de suivi, contacts, actions effectuées..." {...form.register("notes")} />
            </div>
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
