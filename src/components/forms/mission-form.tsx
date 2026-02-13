"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { missionSchema, type MissionFormData } from "@/lib/schemas";
import { createMission, updateMission } from "@/lib/actions/missions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import type { Mission, Logement, Profile } from "@/types/database";
import { MISSION_TYPE_LABELS, MISSION_STATUS_LABELS, MISSION_PRIORITY_LABELS } from "@/types/database";

interface Props {
  mission?: Mission;
  logements: Logement[];
  profiles: Profile[];
  isAdmin: boolean;
  currentUserId: string;
}

export function MissionForm({ mission, logements, profiles, isAdmin: admin, currentUserId }: Props) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!mission;

  const form = useForm<MissionFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(missionSchema) as any,
    defaultValues: {
      logement_id: mission?.logement_id ?? "",
      assigned_to: mission?.assigned_to ?? "",
      type: mission?.type ?? "CHECKIN",
      status: mission?.status ?? "A_FAIRE",
      priority: mission?.priority ?? "NORMALE",
      scheduled_at: mission?.scheduled_at ? new Date(mission.scheduled_at).toISOString().slice(0, 16) : "",
      time_spent_minutes: mission?.time_spent_minutes ?? undefined,
      notes: mission?.notes ?? "",
    },
  });

  async function onSubmit(data: MissionFormData) {
    setLoading(true);
    try {
      if (isEdit) { await updateMission(mission!.id, data); }
      else { await createMission(data); }
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
                <SelectTrigger><SelectValue placeholder="Sélectionner un logement" /></SelectTrigger>
                <SelectContent>{logements.map((l) => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}</SelectContent>
              </Select>
              {form.formState.errors.logement_id && <p className="text-sm text-destructive">{form.formState.errors.logement_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Assigné à</Label>
              <Select defaultValue={form.getValues("assigned_to") || "NONE"} onValueChange={(v) => form.setValue("assigned_to", v === "NONE" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Non assigné" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">— Non assigné —</SelectItem>
                  {admin ? profiles.map((p) => (<SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)) : <SelectItem value={currentUserId}>Moi-même</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select defaultValue={form.getValues("type")} onValueChange={(v) => form.setValue("type", v as MissionFormData["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(MISSION_TYPE_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select defaultValue={form.getValues("priority")} onValueChange={(v) => form.setValue("priority", v as MissionFormData["priority"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(MISSION_PRIORITY_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select defaultValue={form.getValues("status")} onValueChange={(v) => form.setValue("status", v as MissionFormData["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(MISSION_STATUS_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_at">Date planifiée *</Label>
              <Input id="scheduled_at" type="datetime-local" {...form.register("scheduled_at")} />
              {form.formState.errors.scheduled_at && <p className="text-sm text-destructive">{form.formState.errors.scheduled_at.message}</p>}
            </div>
            {isEdit && (
              <div className="space-y-2">
                <Label htmlFor="time_spent_minutes">Temps passé (min)</Label>
                <Input id="time_spent_minutes" type="number" {...form.register("time_spent_minutes")} />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...form.register("notes")} />
          </div>
          <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
