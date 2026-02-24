"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRecurrence, updateRecurrence } from "@/lib/actions/mission-recurrences";
import { toast } from "sonner";
import { Loader2, Plus, Pencil } from "lucide-react";
import {
  MISSION_TYPE_LABELS,
  MISSION_PRIORITY_LABELS,
  RECURRENCE_FREQUENCY_LABELS,
} from "@/types/database";
import type { MissionRecurrence, MissionType, MissionPriority, RecurrenceFrequency } from "@/types/database";

const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: "Dimanche",
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
};

interface RecurrenceFormProps {
  recurrence?: MissionRecurrence;
  logements: Array<{ id: string; name: string }>;
  operators: Array<{ id: string; full_name: string }>;
  onSuccess?: () => void;
}

export function RecurrenceForm({
  recurrence,
  logements,
  operators,
  onSuccess,
}: RecurrenceFormProps) {
  const isEditing = !!recurrence;
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [logementId, setLogementId] = useState(recurrence?.logement_id ?? "");
  const [type, setType] = useState<MissionType>(recurrence?.type ?? "MENAGE");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    recurrence?.frequency ?? "HEBDOMADAIRE"
  );
  const [dayOfWeek, setDayOfWeek] = useState<string>(
    recurrence?.day_of_week?.toString() ?? "1"
  );
  const [dayOfMonth, setDayOfMonth] = useState<string>(
    recurrence?.day_of_month?.toString() ?? "1"
  );
  const [scheduledTime, setScheduledTime] = useState(
    recurrence?.scheduled_time ?? "09:00"
  );
  const [assignedTo, setAssignedTo] = useState(recurrence?.assigned_to ?? "");
  const [priority, setPriority] = useState<MissionPriority>(
    recurrence?.priority ?? "NORMALE"
  );
  const [notes, setNotes] = useState(recurrence?.notes ?? "");

  const resetForm = () => {
    if (!isEditing) {
      setLogementId("");
      setType("MENAGE");
      setFrequency("HEBDOMADAIRE");
      setDayOfWeek("1");
      setDayOfMonth("1");
      setScheduledTime("09:00");
      setAssignedTo("");
      setPriority("NORMALE");
      setNotes("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      logement_id: logementId,
      type,
      frequency,
      day_of_week: frequency === "HEBDOMADAIRE" ? Number(dayOfWeek) : null,
      day_of_month: frequency === "MENSUEL" ? Number(dayOfMonth) : null,
      scheduled_time: scheduledTime,
      assigned_to: assignedTo,
      priority,
      notes,
      active: recurrence?.active ?? true,
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateRecurrence(recurrence!.id, formData)
        : await createRecurrence(formData);

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        resetForm();
        onSuccess?.();
      } else {
        toast.error(result.error ?? "Erreur");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="sm">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Nouvelle récurrence
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la récurrence" : "Nouvelle récurrence"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logement */}
          <div className="space-y-2">
            <Label htmlFor="logement_id">Logement</Label>
            <Select value={logementId} onValueChange={setLogementId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un logement" />
              </SelectTrigger>
              <SelectContent>
                {logements.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type de mission</Label>
            <Select value={type} onValueChange={(v) => setType(v as MissionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MISSION_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Fréquence</Label>
            <Select
              value={frequency}
              onValueChange={(v) => setFrequency(v as RecurrenceFrequency)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RECURRENCE_FREQUENCY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day of week (only for HEBDOMADAIRE) */}
          {frequency === "HEBDOMADAIRE" && (
            <div className="space-y-2">
              <Label htmlFor="day_of_week">Jour de la semaine</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DAY_OF_WEEK_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Day of month (only for MENSUEL) */}
          {frequency === "MENSUEL" && (
            <div className="space-y-2">
              <Label htmlFor="day_of_month">Jour du mois</Label>
              <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Scheduled time */}
          <div className="space-y-2">
            <Label htmlFor="scheduled_time">Heure planifiée</Label>
            <Input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>

          {/* Assigned to */}
          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assigné à</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder="Non assigné" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Non assigné</SelectItem>
                {operators.map((op) => (
                  <SelectItem key={op.id} value={op.id}>
                    {op.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priorité</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as MissionPriority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MISSION_PRIORITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes optionnelles..."
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending || !logementId}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {isEditing ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
