"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, UserPlus, Zap, CheckCircle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BulkAssignDialog } from "./bulk-assign-dialog";
import { autoAssignMissions, bulkCompleteMissions, bulkDeleteMissions } from "@/lib/actions/missions";
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAutoAssign = async () => {
    setLoading(true);

    const result = await autoAssignMissions({
      mission_ids: missionIds,
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

  const handleBulkComplete = async () => {
    setLoading(true);

    const result = await bulkCompleteMissions(missionIds);

    setLoading(false);

    if (result.success) {
      toast.success(result.message);
      onClear();
    } else {
      toast.error(result.error);
    }
  };

  const handleBulkDelete = async () => {
    setLoading(true);

    const result = await bulkDeleteMissions(missionIds);

    setLoading(false);
    setDeleteDialogOpen(false);

    if (result.success) {
      toast.success(result.message);
      onClear();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg">
      <span className="text-sm font-medium whitespace-nowrap">
        {selectedCount} mission{selectedCount > 1 ? "s" : ""} sélectionnée{selectedCount > 1 ? "s" : ""}
      </span>

      <div className="flex flex-wrap gap-1.5 sm:gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDialogOpen(true)}
          aria-label="Assigner à un opérateur"
        >
          <UserPlus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Assigner à...</span>
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={handleAutoAssign}
          disabled={loading}
          aria-label="Auto-assigner"
        >
          <Zap className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Auto-assigner</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleBulkComplete}
          disabled={loading}
          aria-label="Terminer les missions"
        >
          <CheckCircle className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Terminer</span>
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteDialogOpen(true)}
          aria-label="Supprimer les missions"
        >
          <Trash2 className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Supprimer</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={onClear} aria-label="Désélectionner tout">
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {selectedCount} mission{selectedCount > 1 ? "s" : ""} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les missions seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
