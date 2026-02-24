"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { InterventionChecklist as InterventionChecklistType } from "@/types/database";
import {
  getInterventionChecklist,
  createInterventionChecklist,
  updateChecklistItem,
  completeChecklist,
} from "@/lib/actions/intervention-checklists";

interface InterventionChecklistProps {
  incidentId: string;
  isAdmin: boolean;
}

export function InterventionChecklist({ incidentId, isAdmin }: InterventionChecklistProps) {
  const [checklist, setChecklist] = useState<InterventionChecklistType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Creation form state
  const [creating, setCreating] = useState(false);
  const [newItems, setNewItems] = useState<string[]>([""]);

  useEffect(() => {
    loadChecklist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadChecklist() {
    setLoading(true);
    const data = await getInterventionChecklist(incidentId);
    setChecklist(data);
    setLoading(false);
  }

  function addNewItem() {
    setNewItems([...newItems, ""]);
  }

  function removeNewItem(index: number) {
    setNewItems(newItems.filter((_, i) => i !== index));
  }

  function updateNewItem(index: number, value: string) {
    const updated = [...newItems];
    updated[index] = value;
    setNewItems(updated);
  }

  function handleCreate() {
    const validItems = newItems
      .map((label) => label.trim())
      .filter((label) => label.length > 0);

    if (validItems.length === 0) {
      toast.error("Ajoutez au moins un \u00e9l\u00e9ment");
      return;
    }

    startTransition(async () => {
      const result = await createInterventionChecklist(
        incidentId,
        validItems.map((label) => ({ label, checked: false }))
      );
      if (result.success) {
        toast.success(result.message);
        setCreating(false);
        setNewItems([""]);
        await loadChecklist();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleToggleItem(itemIndex: number, checked: boolean) {
    if (!checklist) return;
    startTransition(async () => {
      const result = await updateChecklistItem(checklist.id, itemIndex, checked);
      if (result.success) {
        await loadChecklist();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleUpdateNote(itemIndex: number, note: string) {
    if (!checklist) return;
    const items = checklist.items as Array<{ label: string; checked: boolean; note?: string }>;
    startTransition(async () => {
      const result = await updateChecklistItem(
        checklist.id,
        itemIndex,
        items[itemIndex].checked,
        note
      );
      if (result.success) {
        await loadChecklist();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleComplete() {
    if (!checklist) return;
    startTransition(async () => {
      const result = await completeChecklist(checklist.id);
      if (result.success) {
        toast.success(result.message);
        await loadChecklist();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="h-5 w-5" />
            Checklist d&apos;intervention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  // No checklist exists — show creation UI for admins
  if (!checklist) {
    if (!isAdmin) return null;

    if (!creating) {
      return (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardCheck className="h-5 w-5" />
                Checklist d&apos;intervention
              </CardTitle>
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Cr&eacute;er une checklist
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aucune checklist d&apos;intervention pour cet incident.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="h-5 w-5" />
            Nouvelle checklist d&apos;intervention
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {newItems.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => updateNewItem(index, e.target.value)}
                placeholder={`\u00c9l\u00e9ment ${index + 1}...`}
              />
              {newItems.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeNewItem(index)}
                  className="shrink-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addNewItem}>
            <Plus className="h-4 w-4 mr-1" /> Ajouter un &eacute;l&eacute;ment
          </Button>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? "Cr\u00e9ation..." : "Cr\u00e9er la checklist"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCreating(false);
                setNewItems([""]);
              }}
            >
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Checklist exists — show items
  const items = checklist.items as Array<{ label: string; checked: boolean; note?: string }>;
  const allChecked = items.every((item) => item.checked);
  const isCompleted = !!checklist.completed_at;
  const checkedCount = items.filter((item) => item.checked).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="h-5 w-5" />
            Checklist d&apos;intervention
            <Badge variant={isCompleted ? "default" : "secondary"} className="ml-2">
              {isCompleted ? "Compl\u00e9t\u00e9e" : `${checkedCount}/${items.length}`}
            </Badge>
          </CardTitle>
          {!isCompleted && allChecked && (
            <Button size="sm" onClick={handleComplete} disabled={isPending}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {isPending ? "..." : "Compl\u00e9ter"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={item.checked}
                  disabled={isCompleted || isPending}
                  onChange={(e) => handleToggleItem(index, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span
                  className={`text-sm ${
                    item.checked ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {item.label}
                </span>
              </div>
              {!isCompleted && (
                <div className="ml-7">
                  <Input
                    placeholder="Note (optionnel)..."
                    value={item.note ?? ""}
                    onChange={(e) => handleUpdateNote(index, e.target.value)}
                    disabled={isPending}
                    className="text-xs h-7"
                  />
                </div>
              )}
              {isCompleted && item.note && (
                <p className="ml-7 text-xs text-muted-foreground">{item.note}</p>
              )}
            </div>
          ))}
        </div>
        {isCompleted && (
          <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
            Compl&eacute;t&eacute;e le{" "}
            {new Date(checklist.completed_at!).toLocaleString("fr-FR")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
