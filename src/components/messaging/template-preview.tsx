"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";

const SAMPLE_DATA: Record<string, string> = {
  // Voyageur
  "{{guest_name}}": "Jean Dupont",
  "{{guest_email}}": "jean.dupont@email.com",
  "{{guest_phone}}": "+33 6 12 34 56 78",
  // Réservation
  "{{check_in_date}}": "15/03/2025",
  "{{check_out_date}}": "20/03/2025",
  "{{check_in_time}}": "15:00",
  "{{check_out_time}}": "11:00",
  "{{amount}}": "850,00 €",
  "{{platform}}": "Airbnb",
  // Logement
  "{{logement_name}}": "Appartement Marais",
  "{{logement_address}}": "12 Rue des Rosiers, 75004 Paris",
  "{{wifi_name}}": "Marais-WiFi",
  "{{wifi_password}}": "bienvenue2025",
  "{{lockbox_code}}": "4589",
  // Organisation
  "{{org_name}}": "Ma Conciergerie",
  "{{org_phone}}": "+33 1 23 45 67 89",
  "{{org_email}}": "contact@maconciergerie.fr",
  // Propriétaire
  "{{owner_name}}": "Marie Martin",
  "{{owner_email}}": "marie.martin@email.com",
  // Opérateur
  "{{operator_name}}": "Pierre Lefebvre",
};

interface TemplatePreviewProps {
  body: string;
  subject: string;
}

function replaceVariables(text: string): string {
  let result = text;
  for (const [key, value] of Object.entries(SAMPLE_DATA)) {
    result = result.replaceAll(key, value);
  }
  return result;
}

export function TemplatePreview({ body, subject }: TemplatePreviewProps) {
  const previewSubject = useMemo(() => replaceVariables(subject), [subject]);
  const previewBody = useMemo(() => replaceVariables(body), [body]);

  if (!body && !subject) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Aperçu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {subject && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Sujet</p>
            <p className="text-sm font-medium">{previewSubject}</p>
          </div>
        )}
        {body && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Message</p>
            <div className="text-sm whitespace-pre-wrap bg-muted/50 rounded-md p-3 border">
              {previewBody}
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground italic">
          Les variables sont remplacées par des exemples pour l&apos;aperçu.
        </p>
      </CardContent>
    </Card>
  );
}
