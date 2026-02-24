"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { createMissionReport } from "@/lib/actions/mission-reports";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface MissionReportFormProps {
  missionId: string;
}

export function MissionReportForm({ missionId }: MissionReportFormProps) {
  const [isPending, startTransition] = useTransition();
  const [checklist, setChecklist] = useState<
    Array<{ label: string; checked: boolean }>
  >([{ label: "", checked: false }]);
  const [notes, setNotes] = useState("");
  const [issuesFound, setIssuesFound] = useState("");
  const [supplies, setSupplies] = useState<
    Array<{ name: string; quantity: number }>
  >([]);

  function addChecklistItem() {
    setChecklist((prev) => [...prev, { label: "", checked: false }]);
  }

  function removeChecklistItem(index: number) {
    setChecklist((prev) => prev.filter((_, i) => i !== index));
  }

  function updateChecklistLabel(index: number, label: string) {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, label } : item))
    );
  }

  function updateChecklistChecked(index: number, checked: boolean) {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, checked } : item))
    );
  }

  function addSupply() {
    setSupplies((prev) => [...prev, { name: "", quantity: 1 }]);
  }

  function removeSupply(index: number) {
    setSupplies((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSupplyName(index: number, name: string) {
    setSupplies((prev) =>
      prev.map((item, i) => (i === index ? { ...item, name } : item))
    );
  }

  function updateSupplyQuantity(index: number, quantity: number) {
    setSupplies((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity } : item))
    );
  }

  function handleSubmit() {
    // Filter out empty checklist items
    const validChecklist = checklist.filter((item) => item.label.trim());
    const validSupplies = supplies.filter((item) => item.name.trim());

    if (validChecklist.length === 0) {
      toast.error("Ajoutez au moins un élément à la checklist");
      return;
    }

    startTransition(async () => {
      const result = await createMissionReport({
        mission_id: missionId,
        checklist: validChecklist,
        notes,
        issues_found: issuesFound,
        supplies_used: validSupplies,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error ?? "Erreur lors de la création du rapport");
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Checklist */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Checklist</Label>
        {checklist.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Checkbox
              checked={item.checked}
              onCheckedChange={(checked) =>
                updateChecklistChecked(index, checked === true)
              }
            />
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

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="report-notes" className="text-sm font-medium">
          Notes
        </Label>
        <Textarea
          id="report-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes sur la mission..."
          rows={3}
        />
      </div>

      {/* Issues found */}
      <div className="space-y-1.5">
        <Label htmlFor="report-issues" className="text-sm font-medium">
          Problèmes constatés
        </Label>
        <Textarea
          id="report-issues"
          value={issuesFound}
          onChange={(e) => setIssuesFound(e.target.value)}
          placeholder="Décrivez les problèmes rencontrés..."
          rows={3}
        />
      </div>

      {/* Supplies used */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Fournitures utilisées</Label>
        {supplies.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={item.name}
              onChange={(e) => updateSupplyName(index, e.target.value)}
              placeholder="Nom de la fourniture..."
              className="flex-1"
            />
            <Input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) =>
                updateSupplyQuantity(index, parseInt(e.target.value) || 1)
              }
              className="w-20"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => removeSupply(index)}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSupply}
        >
          <Plus className="h-4 w-4 mr-1" />
          Ajouter une fourniture
        </Button>
      </div>

      {/* Submit */}
      <Button onClick={handleSubmit} disabled={isPending} className="w-full">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Envoi en cours...
          </>
        ) : (
          "Soumettre le rapport"
        )}
      </Button>
    </div>
  );
}
