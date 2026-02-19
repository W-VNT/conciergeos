"use client";

import { useState, useTransition } from "react";
import { Mail, Clock, CheckCircle2 } from "lucide-react";
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
import { inviteProprietaire } from "@/lib/actions/team";
import { toast } from "sonner";

interface Props {
  proprietaireId: string;
  email: string;
  name: string;
  status: "none" | "pending" | "connected";
}

export function InviteProprietaireButton({ proprietaireId, email, name, status }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await inviteProprietaire({ proprietaireId, email, name });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Invitation envoyée à ${email}`);
      }
      setOpen(false);
    });
  }

  if (status === "connected") {
    return (
      <Button variant="outline" disabled>
        <CheckCircle2 className="h-4 w-4 mr-2" />
        Connecté
      </Button>
    );
  }

  if (status === "pending") {
    return (
      <Button variant="outline" disabled>
        <Clock className="h-4 w-4 mr-2" />
        Invitation envoyée
      </Button>
    );
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Mail className="h-4 w-4 mr-2" />
        Inviter
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Inviter {name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Un email d&apos;invitation sera envoyé à <strong>{email}</strong>. Le propriétaire pourra accéder à son espace en lecture seule (logements, réservations, contrats).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
              {isPending ? "Envoi…" : "Envoyer l'invitation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
