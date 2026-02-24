"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getIcalUrl } from "@/lib/actions/ical";

interface IcalExportButtonProps {
  organisationId: string;
}

export function IcalExportButton({ organisationId }: IcalExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [icalUrl, setIcalUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerateUrl() {
    setLoading(true);
    try {
      const result = await getIcalUrl(organisationId);
      if (result.success && result.data) {
        setIcalUrl(result.data.url);
      } else {
        toast.error(result.error || "Erreur lors de la generation du lien");
      }
    } catch {
      toast.error("Erreur lors de la generation du lien");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!icalUrl) return;
    try {
      await navigator.clipboard.writeText(icalUrl);
      setCopied(true);
      toast.success("Lien copie dans le presse-papiers");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien");
    }
  }

  function handleOpenDialog(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen && !icalUrl) {
      handleGenerateUrl();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarIcon className="h-4 w-4 mr-2" />
          Exporter iCal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exporter le calendrier (iCal)</DialogTitle>
          <DialogDescription>
            Utilisez ce lien pour synchroniser votre calendrier ConciergeOS avec
            Google Calendar, Apple Calendar, Outlook ou tout autre client
            calendrier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : icalUrl ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="ical-url">Lien iCal</Label>
                <div className="flex gap-2">
                  <Input
                    id="ical-url"
                    value={icalUrl}
                    readOnly
                    className="text-xs"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button onClick={handleCopy} className="w-full" variant="default">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copie !
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copier le lien
                  </>
                )}
              </Button>

              <div className="rounded-lg bg-muted p-3 space-y-2">
                <p className="text-sm font-medium">Comment utiliser ce lien ?</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-start gap-2">
                    <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Google Calendar :</strong> Parametres &gt; Ajouter un
                      calendrier &gt; A partir d&apos;une URL
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Apple Calendar :</strong> Fichier &gt; Nouvel
                      abonnement au calendrier
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Outlook :</strong> Ajouter un calendrier &gt;
                      S&apos;abonner a partir du web
                    </span>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Erreur lors du chargement du lien iCal.
              <Button
                variant="link"
                size="sm"
                onClick={handleGenerateUrl}
                className="ml-1"
              >
                Reessayer
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
