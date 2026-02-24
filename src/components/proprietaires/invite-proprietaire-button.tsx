"use client";

import { useState, useTransition } from "react";
import { Mail, Clock, CheckCircle2, RefreshCw } from "lucide-react";
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
import { inviteProprietaire, resendInvitation } from "@/lib/actions/team";
import { toast } from "sonner";

interface Props {
  proprietaireId: string;
  email: string;
  name: string;
  status: "none" | "pending" | "expired" | "connected";
  invitationId?: string;
}

export function InviteProprietaireButton({ proprietaireId, email, name, status, invitationId }: Props) {
  const [open, setOpen] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);
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

  function handleResend() {
    if (!invitationId) return;
    startTransition(async () => {
      const result = await resendInvitation(invitationId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || "Invitation relancée avec succès");
      }
      setResendOpen(false);
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

  if (status === "pending" || status === "expired") {
    return (
      <>
        <Button variant="outline" disabled className="cursor-default">
          <Clock className="h-4 w-4 mr-2" />
          {status === "expired" ? "Invitation expirée" : "Invitation envoyée"}
        </Button>
        {invitationId && (
          <Button variant="outline" onClick={() => setResendOpen(true)} disabled={isPending}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Relancer
          </Button>
        )}

        <AlertDialog open={resendOpen} onOpenChange={setResendOpen}>
          <AlertDialogContent className="max-w-sm rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Relancer l&apos;invitation ?</AlertDialogTitle>
              <AlertDialogDescription>
                Un nouvel email d&apos;invitation sera envoyé à <strong>{email}</strong> avec un nouveau lien valable 7 jours.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleResend} disabled={isPending}>
                {isPending ? "Envoi…" : "Relancer l'invitation"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
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
