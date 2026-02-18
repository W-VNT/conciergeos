"use client";

import { useState, useTransition } from "react";
import { PenLine } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { markContratAsSigned } from "@/lib/actions/contrats";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SignContratButtonProps {
  contratId: string;
}

export function SignContratButton({ contratId }: SignContratButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    startTransition(async () => {
      try {
        await markContratAsSigned(contratId);
        toast.success("Contrat signé — modifications verrouillées");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Erreur lors de la signature du contrat");
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PenLine className="h-4 w-4 mr-2" />
        Signer le contrat
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Signer le contrat ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est <strong>irréversible</strong>. Une fois signé, le
              contrat sera verrouillé et ne pourra plus être modifié ni supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
              {isPending ? "Signature..." : "Confirmer la signature"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
