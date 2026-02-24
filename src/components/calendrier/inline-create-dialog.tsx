"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createMission } from "@/lib/actions/missions";
import {
  MISSION_TYPE_LABELS,
  MISSION_PRIORITY_LABELS,
} from "@/types/database";
import type { MissionType, MissionPriority } from "@/types/database";

interface InlineCreateLogement {
  id: string;
  name: string;
}

interface InlineCreateOperator {
  id: string;
  full_name: string;
}

interface InlineCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: string; // YYYY-MM-DD
  defaultTime: string; // HH:MM
  logements: InlineCreateLogement[];
  operators: InlineCreateOperator[];
}

export function InlineCreateDialog({
  open,
  onOpenChange,
  defaultDate,
  defaultTime,
  logements,
  operators,
}: InlineCreateDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<MissionType>("MENAGE");
  const [logementId, setLogementId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [priority, setPriority] = useState<MissionPriority>("NORMALE");
  const [notes, setNotes] = useState("");

  // Reset form when dialog opens with new defaults
  function resetForm() {
    setType("MENAGE");
    setLogementId("");
    setAssignedTo("");
    setDate(defaultDate);
    setTime(defaultTime);
    setPriority("NORMALE");
    setNotes("");
  }

  function handleOpenChange(newOpen: boolean) {
    if (newOpen) {
      // Update defaults when opening
      setDate(defaultDate);
      setTime(defaultTime);
    }
    onOpenChange(newOpen);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!logementId) {
      toast.error("Veuillez sélectionner un logement");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createMission({
          logement_id: logementId,
          assigned_to: assignedTo || "",
          type,
          status: "A_FAIRE",
          priority,
          scheduled_date: date,
          scheduled_time: time,
          notes,
        });

        if (!result.success) {
          toast.error(result.error ?? "Erreur lors de la création");
          return;
        }

        toast.success(result.message ?? "Mission créée avec succès");
        resetForm();
        onOpenChange(false);
      } catch {
        toast.error("Erreur lors de la création de la mission");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Nouvelle mission</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div className="space-y-1.5">
            <Label htmlFor="inline-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as MissionType)}>
              <SelectTrigger id="inline-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(MISSION_TYPE_LABELS) as [MissionType, string][]).map(
                  ([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Logement */}
          <div className="space-y-1.5">
            <Label htmlFor="inline-logement">Logement</Label>
            <Select value={logementId} onValueChange={setLogementId}>
              <SelectTrigger id="inline-logement">
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

          {/* Assigned to */}
          <div className="space-y-1.5">
            <Label htmlFor="inline-assigned">Assigné à</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger id="inline-assigned">
                <SelectValue placeholder="Non assigné" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Non assigné</SelectItem>
                {operators.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="inline-date">Date</Label>
              <Input
                id="inline-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inline-time">Heure</Label>
              <Input
                id="inline-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label htmlFor="inline-priority">Priorité</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as MissionPriority)}>
              <SelectTrigger id="inline-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(MISSION_PRIORITY_LABELS) as [MissionPriority, string][]).map(
                  ([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="inline-notes">Notes</Label>
            <Textarea
              id="inline-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes optionnelles..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer la mission
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
