"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { incidentSchema, type IncidentFormData } from "@/lib/schemas";
import { createIncident, updateIncident } from "@/lib/actions/incidents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import type { Incident, Logement, Prestataire } from "@/types/database";
import { INCIDENT_SEVERITY_LABELS, INCIDENT_STATUS_LABELS } from "@/types/database";

interface Props {
  incident?: Incident;
  logements: Logement[];
  prestataires: Prestataire[];
  defaultLogementId?: string;
  defaultMissionId?: string;
}

export function IncidentForm({ incident, logements, prestataires, defaultLogementId, defaultMissionId }: Props) {
  const [loading, setLoading] = useState(false);
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
      description: incident?.description ?? "",
      cost: incident?.cost ?? null,
    },
  });

  async function onSubmit(data: IncidentFormData) {
    setLoading(true);
    try {
      if (isEdit) { await updateIncident(incident!.id, data); }
      else { await createIncident(data); }
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
              <Select defaultValue={form.getValues("logement_id")} onValueChange={(v) => form.setValue("logement_id", v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{logements.map((l) => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}</SelectContent>
              </Select>
              {form.formState.errors.logement_id && <p className="text-sm text-destructive">{form.formState.errors.logement_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Sévérité</Label>
              <Select defaultValue={form.getValues("severity")} onValueChange={(v) => form.setValue("severity", v as IncidentFormData["severity"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(INCIDENT_SEVERITY_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select defaultValue={form.getValues("status")} onValueChange={(v) => form.setValue("status", v as IncidentFormData["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(INCIDENT_STATUS_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prestataire</Label>
              <Select defaultValue={form.getValues("prestataire_id") || "NONE"} onValueChange={(v) => form.setValue("prestataire_id", v === "NONE" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">— Aucun —</SelectItem>
                  {prestataires.map((p) => (<SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" rows={3} {...form.register("description")} />
              {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
            </div>
            <div className="space-y-2"><Label htmlFor="cost">Coût (EUR)</Label><Input id="cost" type="number" step="0.01" {...form.register("cost")} /></div>
          </div>
          <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
