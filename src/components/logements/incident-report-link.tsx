"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { generateIncidentReportToken } from "@/lib/actions/public-incidents";

interface IncidentReportLinkProps {
  logementId: string;
  existingToken: string | null;
}

export function IncidentReportLink({ logementId, existingToken }: IncidentReportLinkProps) {
  const [token, setToken] = useState<string | null>(existingToken);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const reportUrl = token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/signalement/${token}`
    : null;

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateIncidentReportToken(logementId);
      if (result.success && result.data?.token) {
        setToken(result.data.token);
        toast.success(result.message);
      } else {
        toast.error(result.error ?? "Erreur lors de la g\u00e9n\u00e9ration");
      }
    });
  }

  async function handleCopy() {
    if (!reportUrl) return;
    try {
      await navigator.clipboard.writeText(reportUrl);
      setCopied(true);
      toast.success("Lien copi\u00e9 dans le presse-papiers");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4" />
          Lien de signalement public
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Partagez ce lien avec vos voyageurs pour qu&apos;ils puissent signaler
          un incident directement, sans compte.
        </p>

        {reportUrl ? (
          <div className="flex gap-2">
            <Input
              readOnly
              value={reportUrl}
              className="text-xs font-mono"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              title="Copier le lien"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleGenerate}
              disabled={isPending}
              title="R\u00e9g\u00e9n\u00e9rer le lien"
            >
              <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            </Button>
          </div>
        ) : (
          <Button onClick={handleGenerate} disabled={isPending} variant="outline">
            {isPending ? "G\u00e9n\u00e9ration..." : "G\u00e9n\u00e9rer un lien de signalement"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
