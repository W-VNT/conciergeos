"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MISSION_TYPE_LABELS, MISSION_STATUS_LABELS } from "@/types/database";
import type { Mission } from "@/types/database";
import { BulkAssignmentToolbar } from "./bulk-assignment-toolbar";
import Link from "next/link";

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

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left w-12">
                <Checkbox
                  checked={selectedIds.length === missions.length && missions.length > 0}
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Logement</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Statut</th>
              <th className="p-3 text-left">Assigné à</th>
            </tr>
          </thead>
          <tbody>
            {missions.map((mission) => (
              <tr
                key={mission.id}
                className="border-t hover:bg-gray-50"
              >
                <td className="p-3">
                  <Checkbox
                    checked={selectedIds.includes(mission.id)}
                    onCheckedChange={() => toggleSelection(mission.id)}
                  />
                </td>
                <td className="p-3">
                  <Badge variant="outline">
                    {MISSION_TYPE_LABELS[mission.type]}
                  </Badge>
                </td>
                <td className="p-3">
                  <Link href={`/missions/${mission.id}`} className="hover:underline">
                    {mission.logement?.name}
                  </Link>
                </td>
                <td className="p-3">
                  {new Date(mission.scheduled_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="p-3">
                  <Badge>{MISSION_STATUS_LABELS[mission.status]}</Badge>
                </td>
                <td className="p-3">{mission.assignee?.full_name || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
