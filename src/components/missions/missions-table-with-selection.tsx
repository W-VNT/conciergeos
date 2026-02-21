"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/status-badge";
import { CompleteMissionButton } from "@/components/shared/complete-mission-button";
import { MISSION_TYPE_LABELS, MISSION_STATUS_LABELS, MISSION_PRIORITY_LABELS } from "@/types/database";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Mission } from "@/types/database";
import { BulkAssignmentToolbar } from "./bulk-assignment-toolbar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface Props {
  missions: Mission[];
  organisationId: string;
}

export function MissionsTableWithSelection({ missions, organisationId }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedIds((prev) =>
      prev.length === missions.length ? [] : missions.map((m) => m.id)
    );
  };

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <BulkAssignmentToolbar
          selectedCount={selectedIds.length}
          missionIds={selectedIds}
          organisationId={organisationId}
          onClear={() => setSelectedIds([])}
        />
      )}

      {/* Vue mobile : cards */}
      <div className="md:hidden space-y-3">
        {missions.map((m) => {
          const logement = Array.isArray(m.logement) ? m.logement[0] : m.logement;
          const assignee = Array.isArray(m.assignee) ? m.assignee[0] : m.assignee;
          const isSelected = selectedIds.includes(m.id);

          return (
            <div
              key={m.id}
              className={cn(
                "border rounded-lg p-3 bg-card transition-colors",
                isSelected && "bg-primary/5 border-primary/30"
              )}
            >
              {/* Header : checkbox + type + priorité */}
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelection(m.id)}
                />
                <StatusBadge value={m.type} label={MISSION_TYPE_LABELS[m.type]} />
                {m.priority !== "NORMALE" && (
                  <StatusBadge
                    value={m.priority}
                    label={MISSION_PRIORITY_LABELS[m.priority]}
                    className="ml-auto"
                  />
                )}
              </div>

              {/* Body : logement, date, assigné */}
              <Link href={`/missions/${m.id}`} className="block pl-8">
                <p className="font-medium text-sm">
                  {logement?.name ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(m.scheduled_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                  })}{" "}
                  à{" "}
                  {new Date(m.scheduled_at).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {assignee?.full_name ?? "Non assigné"}
                </div>
              </Link>

              {/* Footer : statut + bouton terminé */}
              <div className="flex items-center justify-between pl-8 mt-2 pt-2 border-t">
                <StatusBadge value={m.status} label={MISSION_STATUS_LABELS[m.status]} />
                {m.status !== "TERMINE" && m.status !== "ANNULE" && (
                  <CompleteMissionButton missionId={m.id} />
                )}
              </div>
            </div>
          );
        })}
        {missions.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Aucune mission trouvée
          </p>
        )}
      </div>

      {/* Vue desktop : table */}
      <div className="hidden md:block rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === missions.length && missions.length > 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Logement</TableHead>
              <TableHead>Assigné</TableHead>
              <TableHead>Planifié</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {missions.map((m) => {
              // Normalize joined data (Supabase can return arrays)
              const logement = Array.isArray(m.logement) ? m.logement[0] : m.logement;
              const assignee = Array.isArray(m.assignee) ? m.assignee[0] : m.assignee;

              return (
                <TableRow
                  key={m.id}
                  className={selectedIds.includes(m.id) ? "bg-primary/5" : ""}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(m.id)}
                      onCheckedChange={() => toggleSelection(m.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={m.type} label={MISSION_TYPE_LABELS[m.type]} />
                  </TableCell>
                  <TableCell>
                    <Link href={`/missions/${m.id}`} className="font-medium hover:underline">
                      {logement?.name ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>{assignee?.full_name ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(m.scheduled_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short"
                    })} à {new Date(m.scheduled_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={m.priority} label={MISSION_PRIORITY_LABELS[m.priority]} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={m.status} label={MISSION_STATUS_LABELS[m.status]} />
                  </TableCell>
                  <TableCell>
                    {m.status !== "TERMINE" && m.status !== "ANNULE" && (
                      <CompleteMissionButton missionId={m.id} />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {missions.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Aucune mission trouvée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
