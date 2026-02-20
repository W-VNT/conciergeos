"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, UserPlus, Zap } from "lucide-react";
import { BulkAssignDialog } from "./bulk-assign-dialog";
import { autoAssignMissions } from "@/lib/actions/missions";
import { toast } from "sonner";

interface Props {
  selectedCount: number;
  missionIds: string[];
  organisationId: string;
  onClear: () => void;
}

export function BulkAssignmentToolbar({
  selectedCount,
  missionIds,
  organisationId,
  onClear,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAutoAssign = async () => {
    setLoading(true);

    const result = await autoAssignMissions({
      mission_ids: missionIds,
      organisation_id: organisationId,
    });

    setLoading(false);

    if (result.assigned.length > 0) {
      toast.success(
        `${result.assigned.length} mission(s) assignée(s) automatiquement`
      );
    }

    if (result.unassigned.length > 0) {
      toast.warning(
        `${result.unassigned.length} mission(s) non assignée(s) (aucun opérateur compatible)`
      );
    }

    onClear();
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
      <span className="text-sm font-medium">
        {selectedCount} mission{selectedCount > 1 ? "s" : ""} sélectionnée{selectedCount > 1 ? "s" : ""}
      </span>

      <div className="flex gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDialogOpen(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Assigner à...
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={handleAutoAssign}
          disabled={loading}
        >
          <Zap className="h-4 w-4 mr-2" />
          Auto-assigner
        </Button>

        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <BulkAssignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        missionIds={missionIds}
        organisationId={organisationId}
        onSuccess={onClear}
      />
    </div>
  );
}
