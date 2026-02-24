"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMissionFromTemplate } from "@/lib/actions/mission-templates";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import type { MissionTemplate, Profile } from "@/types/database";

interface CreateFromTemplateDialogProps {
  templates: MissionTemplate[];
  operators: Pick<Profile, "id" | "full_name">[];
  preselectedTemplateId?: string;
}

export function CreateFromTemplateDialog({
  templates,
  operators,
  preselectedTemplateId,
}: CreateFromTemplateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [templateId, setTemplateId] = useState(preselectedTemplateId ?? "");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [assignedTo, setAssignedTo] = useState("");

  function handleSubmit() {
    if (!templateId) {
      toast.error("Sélectionnez un modèle");
      return;
    }
    if (!scheduledDate) {
      toast.error("La date est requise");
      return;
    }

    const scheduledAt = `${scheduledDate}T${scheduledTime}:00`;

    startTransition(async () => {
      const result = await createMissionFromTemplate(
        templateId,
        scheduledAt,
        assignedTo || undefined
      );

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        if (result.data?.id) {
          router.push(`/missions/${result.data.id}`);
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.error ?? "Erreur");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-1.5" />
          Depuis un modèle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer depuis un modèle</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Template select */}
          <div className="space-y-1.5">
            <Label>Modèle *</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un modèle" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Heure</Label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          {/* Operator (optional) */}
          <div className="space-y-1.5">
            <Label>Assigner à (optionnel)</Label>
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

          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              "Créer la mission"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
