"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { createMessageTemplate, updateMessageTemplate, deleteMessageTemplate } from "@/lib/actions/guest-messaging";
import { MESSAGE_TEMPLATE_TYPE_LABELS } from "@/types/database";
import type { MessageTemplate, MessageTemplateType, MessageChannel } from "@/types/database";

const TEMPLATE_VARIABLES = [
  { key: "{{guest_name}}", label: "Nom du voyageur" },
  { key: "{{logement_name}}", label: "Nom du logement" },
  { key: "{{check_in_date}}", label: "Date d'arrivée" },
  { key: "{{check_out_date}}", label: "Date de départ" },
  { key: "{{lockbox_code}}", label: "Code boîte à clés" },
  { key: "{{wifi_name}}", label: "Nom WiFi" },
  { key: "{{wifi_password}}", label: "Mot de passe WiFi" },
];

interface MessageTemplateFormProps {
  template?: MessageTemplate;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function MessageTemplateForm({ template, trigger, onSuccess }: MessageTemplateFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const router = useRouter();
  const isEdit = !!template;

  const [name, setName] = useState(template?.name ?? "");
  const [type, setType] = useState<MessageTemplateType>(template?.type ?? "CUSTOM");
  const [channel, setChannel] = useState<MessageChannel>(template?.channel ?? "EMAIL");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [body, setBody] = useState(template?.body ?? "");

  function resetForm() {
    if (!isEdit) {
      setName("");
      setType("CUSTOM");
      setChannel("EMAIL");
      setSubject("");
      setBody("");
    }
  }

  function handleInsertVariable(variable: string) {
    setBody((prev) => prev + variable);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const data = { name, type, channel, subject, body, active: true };

      const result = isEdit
        ? await updateMessageTemplate(template!.id, data)
        : await createMessageTemplate(data);

      if (!result.success) {
        toast.error(result.error ?? "Erreur");
        return;
      }

      toast.success(result.message ?? "Enregistré");
      setOpen(false);
      resetForm();
      router.refresh();
      onSuccess?.();
    });
  }

  function handleDelete() {
    if (!template) return;

    startDeleteTransition(async () => {
      const result = await deleteMessageTemplate(template.id);
      if (!result.success) {
        toast.error(result.error ?? "Erreur");
        return;
      }
      toast.success(result.message ?? "Supprimé");
      setOpen(false);
      router.refresh();
      onSuccess?.();
    });
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      {isEdit ? "Modifier" : "Nouveau template"}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le template" : "Nouveau template de message"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifiez les champs ci-dessous puis enregistrez."
              : "Créez un template réutilisable pour vos messages voyageurs."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tpl-name">Nom du template</Label>
            <Input
              id="tpl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Confirmation de réservation"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as MessageTemplateType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(MESSAGE_TEMPLATE_TYPE_LABELS) as [MessageTemplateType, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as MessageChannel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {channel === "EMAIL" && (
            <div className="space-y-2">
              <Label htmlFor="tpl-subject">Sujet</Label>
              <Input
                id="tpl-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Votre réservation chez {{logement_name}}"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tpl-body">Contenu du message</Label>
            <Textarea
              id="tpl-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Rédigez votre message ici..."
              rows={8}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Variables disponibles</Label>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => handleInsertVariable(v.key)}
                  className="inline-flex items-center rounded border px-2 py-0.5 text-xs font-mono hover:bg-muted transition-colors"
                  title={v.label}
                >
                  {v.key}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            {isEdit && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isPending || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Suppression...
                  </>
                ) : (
                  "Supprimer"
                )}
              </Button>
            )}
            <Button type="submit" disabled={isPending || isDeleting}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEdit ? "Enregistrement..." : "Création..."}
                </>
              ) : isEdit ? (
                "Enregistrer"
              ) : (
                "Créer le template"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
