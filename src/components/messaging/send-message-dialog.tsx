"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { sendGuestMessage, replaceTemplateVariables } from "@/lib/actions/guest-messaging";
import type { MessageTemplate, MessageChannel, Reservation, Logement } from "@/types/database";

interface SendMessageDialogProps {
  reservation: Reservation & { logement?: Logement | null };
  templates: MessageTemplate[];
  trigger?: React.ReactNode;
}

export function SendMessageDialog({
  reservation,
  templates,
  trigger,
}: SendMessageDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isReplacing, startReplaceTransition] = useTransition();
  const router = useRouter();

  const [channel, setChannel] = useState<MessageChannel>("EMAIL");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // Filter templates by selected channel
  const filteredTemplates = templates.filter(
    (t) => t.channel === channel && t.active
  );

  // Replace template variables locally (immediate preview)
  function replaceVariablesLocal(text: string): string {
    const logement = reservation.logement;
    const replacements: Record<string, string> = {
      "{{guest_name}}": reservation.guest_name ?? "",
      "{{logement_name}}": logement?.name ?? "",
      "{{check_in_date}}": reservation.check_in_date
        ? new Date(reservation.check_in_date).toLocaleDateString("fr-FR")
        : "",
      "{{check_out_date}}": reservation.check_out_date
        ? new Date(reservation.check_out_date).toLocaleDateString("fr-FR")
        : "",
      "{{lockbox_code}}": logement?.lockbox_code ?? "",
      "{{wifi_name}}": logement?.wifi_name ?? "",
      "{{wifi_password}}": logement?.wifi_password ?? "",
    };

    let result = text;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replaceAll(key, value);
    }
    return result;
  }

  // When a template is selected, populate subject and body with variable replacement
  function handleTemplateSelect(templateId: string) {
    setSelectedTemplateId(templateId);

    if (!templateId) {
      setSubject("");
      setBody("");
      return;
    }

    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    // Replace variables using server action for accuracy
    startReplaceTransition(async () => {
      const replacedSubject = await replaceTemplateVariables(
        template.subject,
        reservation.id
      );
      const replacedBody = await replaceTemplateVariables(
        template.body,
        reservation.id
      );
      setSubject(replacedSubject);
      setBody(replacedBody);
    });
  }

  // Reset when channel changes
  useEffect(() => {
    setSelectedTemplateId("");
    setSubject("");
    setBody("");
  }, [channel]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!body.trim()) {
      toast.error("Le message ne peut pas être vide");
      return;
    }

    startTransition(async () => {
      const result = await sendGuestMessage({
        reservation_id: reservation.id,
        template_id: selectedTemplateId || "",
        channel,
        subject,
        body,
      });

      if (!result.success) {
        toast.error(result.error ?? "Erreur lors de l'envoi");
        return;
      }

      toast.success(result.message ?? "Message envoyé");
      setOpen(false);
      setSelectedTemplateId("");
      setSubject("");
      setBody("");
      router.refresh();
    });
  }

  const hasEmail = !!reservation.guest_email;
  const hasPhone = !!reservation.guest_phone;

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Send className="h-4 w-4 mr-2" />
      Envoyer un message
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Envoyer un message</DialogTitle>
          <DialogDescription>
            Envoyez un message a {reservation.guest_name}
            {reservation.guest_email && ` (${reservation.guest_email})`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Canal</Label>
            <Select
              value={channel}
              onValueChange={(v) => setChannel(v as MessageChannel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMAIL" disabled={!hasEmail}>
                  Email{!hasEmail ? " (pas d'email)" : ""}
                </SelectItem>
                <SelectItem value="SMS" disabled={!hasPhone}>
                  SMS{!hasPhone ? " (pas de téléphone)" : ""}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Template (optionnel)</Label>
            <Select
              value={selectedTemplateId}
              onValueChange={handleTemplateSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun (message libre)</SelectItem>
                {filteredTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {channel === "EMAIL" && (
            <div className="space-y-2">
              <Label htmlFor="msg-subject">Sujet</Label>
              <Input
                id="msg-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Sujet de l'email"
                disabled={isReplacing}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="msg-body">Message</Label>
            <Textarea
              id="msg-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Rédigez votre message..."
              rows={5}
              required
              disabled={isReplacing}
            />
            {isReplacing && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Remplacement des variables...
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending || isReplacing}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
