"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { bulkInviteProprietaires } from "@/lib/actions/bulk-invite";
import { toast } from "sonner";

interface InviteResult {
  total: number;
  success: number;
  errors: Array<{ email: string; error: string }>;
}

export function BulkInviteDialog() {
  const [open, setOpen] = useState(false);
  const [emailsText, setEmailsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InviteResult | null>(null);

  function parseEmails(text: string): string[] {
    return text
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }

  const parsedEmails = parseEmails(emailsText);

  async function handleSubmit() {
    if (parsedEmails.length === 0) {
      toast.error("Veuillez saisir au moins une adresse email");
      return;
    }

    if (parsedEmails.length > 50) {
      toast.error("Maximum 50 emails par envoi");
      return;
    }

    setLoading(true);
    setResult(null);

    const response = await bulkInviteProprietaires(parsedEmails);

    setLoading(false);

    if (response.success && response.data) {
      setResult(response.data);
      if (response.data.success > 0) {
        toast.success(response.message);
      }
    } else {
      toast.error(response.error ?? "Erreur");
    }
  }

  function handleClose() {
    setOpen(false);
    // Reset state after animation
    setTimeout(() => {
      setEmailsText("");
      setResult(null);
    }, 300);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Invitation groupée</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invitation groupée de propriétaires</DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-emails">
                Adresses email (une par ligne ou séparées par des virgules)
              </Label>
              <Textarea
                id="bulk-emails"
                rows={8}
                placeholder={"proprietaire1@example.com\nproprietaire2@example.com\nproprietaire3@example.com"}
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
                disabled={loading}
              />
              {parsedEmails.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {parsedEmails.length} adresse{parsedEmails.length > 1 ? "s" : ""} détectée{parsedEmails.length > 1 ? "s" : ""}
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || parsedEmails.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  `Inviter ${parsedEmails.length > 0 ? parsedEmails.length : ""} propriétaire${parsedEmails.length > 1 ? "s" : ""}`
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex gap-4">
              {result.success > 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">
                    {result.success} envoyée{result.success > 1 ? "s" : ""}
                  </span>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">
                    {result.errors.length} erreur{result.errors.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Error details */}
            {result.errors.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm p-2 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900"
                  >
                    <Badge variant="destructive" className="text-xs shrink-0">
                      Erreur
                    </Badge>
                    <div>
                      <span className="font-mono text-xs">{err.email}</span>
                      <span className="text-muted-foreground"> — {err.error}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleClose}>Fermer</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
