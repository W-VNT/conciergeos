"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ActionResponse } from "@/lib/action-response";

interface DeleteConfirmDialogProps {
  entityType: string;
  entityName: string;
  deleteAction: () => Promise<ActionResponse>;
  redirectPath?: string;
  trigger?: React.ReactNode;
}

/**
 * DeleteConfirmDialog - Confirmation dialog for destructive delete actions
 *
 * Wraps a server delete action with a client-side confirmation dialog.
 * Handles loading states, error handling, and navigation after deletion.
 *
 * @example
 * <DeleteConfirmDialog
 *   entityType="logement"
 *   entityName={logement.name}
 *   deleteAction={async () => {
 *     "use server";
 *     return await deleteLogement(logement.id);
 *   }}
 *   redirectPath="/logements"
 * />
 */
export function DeleteConfirmDialog({
  entityType,
  entityName,
  deleteAction,
  redirectPath,
  trigger,
}: DeleteConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    startTransition(async () => {
      try {
        const result = await deleteAction();

        if (!result.success) {
          toast.error(result.error ?? "Erreur lors de la suppression");
          return;
        }

        toast.success(result.message ?? "Supprimé avec succès");
        setOpen(false);

        if (redirectPath) {
          router.push(redirectPath);
        }
        router.refresh();
      } catch (err: unknown) {
        toast.error((err as Error).message ?? "Erreur lors de la suppression");
      }
    });
  }

  const defaultTrigger = (
    <Button variant="destructive" size="sm">
      <Trash2 className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Supprimer</span>
    </Button>
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || defaultTrigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer {entityType} ?</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer <strong>{entityName}</strong> ?{" "}
            Cette action est <strong>irréversible</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              "Supprimer"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
