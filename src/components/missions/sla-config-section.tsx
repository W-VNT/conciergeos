"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertSlaConfig, deleteSlaConfig } from "@/lib/actions/sla";
import { toast } from "sonner";
import { ChevronDown, Trash2, Plus, Save, Loader2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { MISSION_TYPE_LABELS } from "@/types/database";
import type { SlaConfig, MissionType } from "@/types/database";

const MISSION_TYPES: MissionType[] = [
  "CHECKIN",
  "CHECKOUT",
  "MENAGE",
  "INTERVENTION",
  "URGENCE",
];

interface SlaConfigSectionProps {
  initialConfigs: SlaConfig[];
}

export function SlaConfigSection({ initialConfigs }: SlaConfigSectionProps) {
  const [configs, setConfigs] = useState<SlaConfig[]>(initialConfigs);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [addingType, setAddingType] = useState<string>("");
  const [addingHours, setAddingHours] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Get mission types not yet configured
  const configuredTypes = configs
    .filter((c) => c.entity_type === "MISSION")
    .map((c) => c.subtype);
  const availableTypes = MISSION_TYPES.filter(
    (t) => !configuredTypes.includes(t)
  );

  const handleSave = (id: string, maxHours: number, subtype: string) => {
    setSavingId(id);
    startTransition(async () => {
      const result = await upsertSlaConfig({
        entity_type: "MISSION",
        subtype,
        max_hours: maxHours,
      });
      if (result.success && result.data) {
        setConfigs((prev) =>
          prev.map((c) => (c.id === id ? result.data! : c))
        );
        setEditingId(null);
        toast.success("SLA mis à jour");
      } else {
        toast.error(result.error ?? "Erreur");
      }
      setSavingId(null);
    });
  };

  const handleAdd = () => {
    if (!addingType || !addingHours || Number(addingHours) < 1) return;

    startTransition(async () => {
      const result = await upsertSlaConfig({
        entity_type: "MISSION",
        subtype: addingType,
        max_hours: Number(addingHours),
      });
      if (result.success && result.data) {
        setConfigs((prev) => [...prev, result.data!]);
        setAddingType("");
        setAddingHours("");
        setShowAddForm(false);
        toast.success("SLA ajouté");
      } else {
        toast.error(result.error ?? "Erreur");
      }
    });
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteSlaConfig(id);
      if (result.success) {
        setConfigs((prev) => prev.filter((c) => c.id !== id));
        toast.success("SLA supprimé");
      } else {
        toast.error(result.error ?? "Erreur");
      }
      setDeletingId(null);
    });
  };

  const missionConfigs = configs.filter((c) => c.entity_type === "MISSION");

  return (
    <Card className="mb-4">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            SLA Missions
            {missionConfigs.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                ({missionConfigs.length} type{missionConfigs.length > 1 ? "s" : ""} configuré{missionConfigs.length > 1 ? "s" : ""})
              </span>
            )}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="space-y-4">
          {missionConfigs.length > 0 ? (
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium text-right">
                      Délai max (heures)
                    </th>
                    <th className="px-4 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {missionConfigs.map((config) => (
                    <tr key={config.id} className="border-b last:border-b-0">
                      <td className="px-4 py-2 font-medium">
                        {MISSION_TYPE_LABELS[config.subtype as MissionType] ??
                          config.subtype}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {editingId === config.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              type="number"
                              min={1}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-20 h-8 text-right"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={
                                savingId === config.id ||
                                !editValue ||
                                Number(editValue) < 1
                              }
                              onClick={() =>
                                handleSave(
                                  config.id,
                                  Number(editValue),
                                  config.subtype
                                )
                              }
                            >
                              {savingId === config.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Save className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <button
                            className="hover:underline cursor-pointer tabular-nums"
                            onClick={() => {
                              setEditingId(config.id);
                              setEditValue(config.max_hours.toString());
                            }}
                          >
                            {config.max_hours}h
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(config.id)}
                          disabled={deletingId === config.id}
                        >
                          {deletingId === config.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun SLA configuré. Ajoutez des délais maximum par type de mission.
            </p>
          )}

          {/* Add new SLA */}
          {availableTypes.length > 0 && (
            <>
              {showAddForm ? (
                <div className="flex items-end gap-2 flex-wrap">
                  <div className="flex-1 min-w-[140px]">
                    <Select value={addingType} onValueChange={setAddingType}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Type de mission" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTypes.map((t) => (
                          <SelectItem key={t} value={t}>
                            {MISSION_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min={1}
                      value={addingHours}
                      onChange={(e) => setAddingHours(e.target.value)}
                      placeholder="Heures"
                      className="h-9"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAdd}
                    disabled={
                      isPending || !addingType || !addingHours || Number(addingHours) < 1
                    }
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1.5" />
                    )}
                    Ajouter
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowAddForm(false);
                      setAddingType("");
                      setAddingHours("");
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Ajouter un SLA
                </Button>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
