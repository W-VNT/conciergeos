"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";
import { submitPublicIncident } from "@/lib/actions/public-incidents";
import { INCIDENT_CATEGORY_LABELS, INCIDENT_SEVERITY_LABELS } from "@/types/database";
import type { IncidentCategory, IncidentSeverity } from "@/types/database";

interface SignalementFormProps {
  token: string;
  logementName: string;
}

export function SignalementForm({ token }: SignalementFormProps) {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<IncidentCategory>("AUTRE");
  const [severity, setSeverity] = useState<IncidentSeverity>("MINEUR");
  const [description, setDescription] = useState("");
  const [guestName, setGuestName] = useState("");

  function handleSubmit() {
    setError(null);

    if (!description.trim()) {
      setError("Veuillez d\u00e9crire le probl\u00e8me");
      return;
    }

    startTransition(async () => {
      const result = await submitPublicIncident(token, {
        category,
        severity,
        description: description.trim(),
        guest_name: guestName.trim() || undefined,
      });

      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error ?? "Une erreur est survenue");
      }
    });
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold">Signalement envoy&eacute;</h2>
            <p className="text-muted-foreground text-sm">
              Votre signalement a bien &eacute;t&eacute; pris en compte. Notre &eacute;quipe va
              le traiter dans les meilleurs d&eacute;lais.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">D&eacute;tails du probl&egrave;me</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="category">Cat&eacute;gorie *</Label>
          <select
            id="category"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value as IncidentCategory)}
          >
            {(Object.entries(INCIDENT_CATEGORY_LABELS) as [IncidentCategory, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            )}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="severity">Gravit&eacute; *</Label>
          <select
            id="severity"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
          >
            {(Object.entries(INCIDENT_SEVERITY_LABELS) as [IncidentSeverity, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            )}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description du probl&egrave;me *</Label>
          <textarea
            id="description"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="D&eacute;crivez le probl&egrave;me rencontr&eacute;..."
            maxLength={5000}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="guest_name">Votre nom (optionnel)</Label>
          <Input
            id="guest_name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Pr&eacute;nom Nom"
            maxLength={200}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <Button
          className="w-full"
          disabled={isPending}
          onClick={handleSubmit}
        >
          {isPending ? "Envoi en cours..." : "Envoyer le signalement"}
        </Button>
      </CardContent>
    </Card>
  );
}
