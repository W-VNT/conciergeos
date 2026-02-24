"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createMissionTemplate,
  updateMissionTemplate,
} from "@/lib/actions/mission-templates";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { MISSION_TYPE_LABELS, MISSION_PRIORITY_LABELS } from "@/types/database";
import type { MissionTemplate, Logement } from "@/types/database";

interface MissionTemplateFormProps {
  logements: Pick<Logement, "id" | "name">[];
  template: MissionTemplate | null;
}

export function MissionTemplateFormClient({
  logements,
  template,
}: MissionTemplateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!template;

  const [name, setName] = useState(template?.name ?? "");
  const [type, setType] = useState(template?.type ?? "MENAGE");
  const [logementId, setLogementId] = useState(template?.logement_id ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [estimatedDuration, setEstimatedDuration] = useState<string>(
    template?.estimated_duration_minutes?.toString() ?? ""
  );
  const [priority, setPriority] = useState(template?.priority ?? "NORMALE");
  const [notes, setNotes] = useState(template?.notes ?? "");
  const [checklist, setChecklist] = useState<Array<{ label: string }>>(
    template?.checklist && template.checklist.length > 0
      ? template.checklist
      : [{ label: "" }]
  );

  function addChecklistItem() {
    setChecklist((prev) => [...prev, { label: "" }]);
  }

  function removeChecklistItem(index: number) {
    setChecklist((prev) => prev.filter((_, i) => i !== index));
  }

  function updateChecklistLabel(index: number, label: string) {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, label } : item))
    );
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    const formData = {
      name: name.trim(),
      type: type as "CHECKIN" | "CHECKOUT" | "MENAGE" | "INTERVENTION" | "URGENCE",
      logement_id: logementId,
      description,
      estimated_duration_minutes: estimatedDuration ? Number(estimatedDuration) : null,
      priority: priority as "NORMALE" | "HAUTE" | "CRITIQUE",
      notes,
      checklist: checklist.filter((c) => c.label.trim()),
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateMissionTemplate(template!.id, formData)
        : await createMissionTemplate(formData);

      if (result.success) {
        toast.success(result.message);
        router.push("/missions/templates");
      } else {
        toast.error(result.error ?? "Erreur");
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="template-name">Nom du modèle *</Label>
          <Input
            id="template-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Ménage standard"
          />
        </div>

        {/* Type + Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Type de mission *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MISSION_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Priorité</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MISSION_PRIORITY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Logement (optional) */}
        <div className="space-y-1.5">
          <Label>Logement (optionnel)</Label>
          <Select value={logementId} onValueChange={setLogementId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un logement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Aucun</SelectItem>
              {logements.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="template-desc">Description</Label>
          <Textarea
            id="template-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description du modèle..."
            rows={3}
          />
        </div>

        {/* Estimated duration */}
        <div className="space-y-1.5">
          <Label htmlFor="template-duration">Durée estimée (minutes)</Label>
          <Input
            id="template-duration"
            type="number"
            min={0}
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(e.target.value)}
            placeholder="Ex: 90"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="template-notes">Notes</Label>
          <Textarea
            id="template-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes pour les opérateurs..."
            rows={2}
          />
        </div>

        {/* Checklist builder */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Checklist du modèle</Label>
          {checklist.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={item.label}
                onChange={(e) => updateChecklistLabel(index, e.target.value)}
                placeholder="Élément de la checklist..."
                className="flex-1"
              />
              {checklist.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => removeChecklistItem(index)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addChecklistItem}
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter un élément
          </Button>
        </div>

        {/* Submit */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? "Mise à jour..." : "Création..."}
              </>
            ) : isEditing ? (
              "Mettre à jour"
            ) : (
              "Créer le modèle"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/missions/templates")}
            disabled={isPending}
          >
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
