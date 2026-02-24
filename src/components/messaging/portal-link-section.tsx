"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Link2, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generatePortalToken } from "@/lib/actions/guest-portal";
import type { GuestPortalToken } from "@/types/database";

interface PortalLinkSectionProps {
  reservationId: string;
  existingToken: GuestPortalToken | null;
}

export function PortalLinkSection({ reservationId, existingToken }: PortalLinkSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [portalUrl, setPortalUrl] = useState<string | null>(() => {
    if (existingToken && new Date(existingToken.expires_at) > new Date()) {
      const baseUrl = typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return `${baseUrl}/guest/${existingToken.token}`;
    }
    return null;
  });
  const router = useRouter();

  function handleGenerate() {
    startTransition(async () => {
      const result = await generatePortalToken(reservationId);

      if (!result.success) {
        toast.error(result.error ?? "Erreur");
        return;
      }

      if (result.data) {
        setPortalUrl(result.data.url);
        toast.success("Lien portail généré");
        router.refresh();
      }
    });
  }

  function handleCopy() {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl);
    toast.success("Lien copié dans le presse-papiers");
  }

  const isExpired = existingToken && new Date(existingToken.expires_at) < new Date();

  return (
    <div className="space-y-3">
      {portalUrl && !isExpired ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input value={portalUrl} readOnly className="text-xs font-mono" />
            <Button variant="outline" size="icon" onClick={handleCopy} title="Copier">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" asChild title="Ouvrir">
              <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
          {existingToken && (
            <p className="text-xs text-muted-foreground">
              Expire le {new Date(existingToken.expires_at).toLocaleDateString("fr-FR")}
            </p>
          )}
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isPending}>
            {isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Régénération...</>
            ) : (
              <><Link2 className="h-4 w-4 mr-2" /> Régénérer le lien</>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {isExpired && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Le lien portail précédent a expiré.
            </p>
          )}
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isPending}>
            {isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Génération...</>
            ) : (
              <><Link2 className="h-4 w-4 mr-2" /> Générer lien portail</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
