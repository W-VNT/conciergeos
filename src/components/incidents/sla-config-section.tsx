"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Save, X, Trash2, ShieldAlert } from "lucide-react";
import { upsertSlaConfig, deleteSlaConfig } from "@/lib/actions/sla";
import { toast } from "sonner";
import type { SlaConfig } from "@/types/database";
import { INCIDENT_SEVERITY_LABELS } from "@/types/database";

const SEVERITIES = ["MINEUR", "MOYEN", "CRITIQUE"] as const;

interface Props {
  slaConfigs: SlaConfig[];
}

export function SlaConfigSection({ slaConfigs }: Props) {
  const [editingSeverity, setEditingSeverity] = useState<string | null>(null);
  const [editHours, setEditHours] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Map severity to config
  const configMap = new Map<string, SlaConfig>();
  for (const config of slaConfigs) {
    if (config.entity_type === "INCIDENT") {
      configMap.set(config.subtype, config);
    }
  }

  async function handleSave(severity: string) {
    const maxHours = parseInt(editHours, 10);
    if (isNaN(maxHours) || maxHours < 1) {
      toast.error("Le délai doit être au minimum 1 heure");
      return;
    }

    setLoading(true);
    const result = await upsertSlaConfig({
      entity_type: "INCIDENT",
      subtype: severity,
      max_hours: maxHours,
    });
    setLoading(false);

    if (result.success) {
      toast.success(result.message);
      setEditingSeverity(null);
      setEditHours("");
    } else {
      toast.error(result.error ?? "Erreur");
    }
  }

  async function handleDelete(config: SlaConfig) {
    setLoading(true);
    const result = await deleteSlaConfig(config.id);
    setLoading(false);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.error ?? "Erreur");
    }
  }

  function startEdit(severity: string) {
    const existing = configMap.get(severity);
    setEditingSeverity(severity);
    setEditHours(existing ? String(existing.max_hours) : "");
  }

  function cancelEdit() {
    setEditingSeverity(null);
    setEditHours("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          SLA par sévérité
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Configurez le délai maximum de résolution par niveau de sévérité. Les incidents dépassant ce délai seront signalés.
        </p>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sévérité</TableHead>
                <TableHead>Délai max (heures)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SEVERITIES.map((severity) => {
                const config = configMap.get(severity);
                const isEditing = editingSeverity === severity;

                return (
                  <TableRow key={severity}>
                    <TableCell>
                      <Badge
                        variant={
                          severity === "CRITIQUE"
                            ? "destructive"
                            : severity === "MOYEN"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {INCIDENT_SEVERITY_LABELS[severity]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          min={1}
                          max={8760}
                          value={editHours}
                          onChange={(e) => setEditHours(e.target.value)}
                          className="w-32"
                          placeholder="heures"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave(severity);
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                      ) : config ? (
                        <span className="font-medium">{config.max_hours}h</span>
                      ) : (
                        <span className="text-muted-foreground">Non configuré</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSave(severity)}
                            disabled={loading}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
                            disabled={loading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(severity)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {config && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(config)}
                              disabled={loading}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
