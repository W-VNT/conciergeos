"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, Copy, Trash2, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  generatePrestatairePortalToken,
  revokePrestatairePortalToken,
  getPortalTokenForPrestataire,
} from "@/lib/actions/prestataire-portal";
import type { PrestatairePortalToken } from "@/types/database";

interface PortalTokenSectionProps {
  prestataireId: string;
}

export function PortalTokenSection({ prestataireId }: PortalTokenSectionProps) {
  const [token, setToken] = useState<PrestatairePortalToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadToken() {
    setLoading(true);
    try {
      const data = await getPortalTokenForPrestataire(prestataireId);
      setToken(data);
    } catch {
      // ignore
    }
    setLoading(false);
  }

  function handleGenerate() {
    startTransition(async () => {
      const res = await generatePrestatairePortalToken(prestataireId);
      if (res.success) {
        toast.success(res.message);
        await loadToken();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleRevoke() {
    if (!token) return;
    startTransition(async () => {
      const res = await revokePrestatairePortalToken(token.id);
      if (res.success) {
        toast.success(res.message);
        setToken(null);
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleCopy() {
    if (!token) return;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${baseUrl}/prestataire-portal/${token.token}`;
    navigator.clipboard.writeText(url);
    toast.success("Lien copié dans le presse-papiers");
  }

  const isExpired = token ? new Date(token.expires_at) < new Date() : false;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const portalUrl = token ? `${baseUrl}/prestataire-portal/${token.token}` : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Portail prestataire
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : token ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Statut :</span>
              {isExpired ? (
                <Badge variant="destructive">Expiré</Badge>
              ) : (
                <Badge variant="default">Actif</Badge>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Expire le</p>
              <p className="text-sm">
                {new Date(token.expires_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                disabled={isPending}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copier le lien
              </Button>
              {portalUrl && (
                <Button size="sm" variant="outline" asChild>
                  <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Ouvrir
                  </a>
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerate}
                disabled={isPending}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Regénérer
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRevoke}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Révoquer
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Aucun lien portail actif. Générez un lien pour permettre au prestataire
              de consulter ses missions, incidents et soumettre des devis.
            </p>
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={isPending}
            >
              <Link2 className="h-4 w-4 mr-1" />
              {isPending ? "Génération..." : "Générer un lien portail"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
