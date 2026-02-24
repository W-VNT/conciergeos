"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { missionSchema, type MissionFormData } from "@/lib/schemas";
import { createMission, updateMission } from "@/lib/actions/missions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FormError } from "@/components/shared/form-error";
import { useState } from "react";
import { toast } from "sonner";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
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
  const router = useRouter();
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
      scheduled_date: mission?.scheduled_at
        ? new Date(mission.scheduled_at).toISOString().split("T")[0]
        : "",
      scheduled_time: mission?.scheduled_at
        ? new Date(mission.scheduled_at).toISOString().split("T")[1].slice(0, 5)
        : "09:00",
      time_spent_minutes: mission?.time_spent_minutes ?? undefined,
      notes: mission?.notes ?? "",
    },
  });
  useUnsavedChanges(form.formState.isDirty);

  async function onSubmit(data: MissionFormData) {
    setLoading(true);
    try {
      const result = isEdit
        ? await updateMission(mission!.id, data)
        : await createMission(data);

      if (!result.success) {
        toast.error(result.error ?? "Erreur");
        setLoading(false);
        return;
      }

      toast.success(result.message ?? "Enregistré avec succès");
      router.push(isEdit ? `/missions/${mission!.id}` : "/missions");
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
                  <SelectTrigger><SelectValue placeholder="Sélectionner un logement" /></SelectTrigger>
                  <SelectContent>{logements.map((l) => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}</SelectContent>
                </Select>
              )} />
              {form.formState.errors.logement_id && <FormError message={form.formState.errors.logement_id.message} />}
            </div>
            <div className="space-y-2">
              <Label>Assigné à</Label>
              <Controller name="assigned_to" control={form.control} render={({ field }) => (
                <Select value={field.value || "NONE"} onValueChange={(v) => field.onChange(v === "NONE" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Non assigné" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">— Non assigné —</SelectItem>
                    {admin ? profiles.map((p) => (<SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)) : <SelectItem value={currentUserId}>Moi-même</SelectItem>}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Controller name="type" control={form.control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(MISSION_TYPE_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>Priorité</Label>
              <Controller name="priority" control={form.control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(MISSION_PRIORITY_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Controller name="status" control={form.control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(MISSION_STATUS_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>Date et heure planifiées *</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input id="scheduled_date" type="date" className="flex-1" {...form.register("scheduled_date")} />
                <Input id="scheduled_time" type="time" className="w-full sm:w-28" {...form.register("scheduled_time")} />
              </div>
              {form.formState.errors.scheduled_date && <FormError message={form.formState.errors.scheduled_date.message} />}
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
