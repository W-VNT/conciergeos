"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createContratTemplate, updateContratTemplate } from "@/lib/actions/contrat-templates";
import type { ContratTemplate } from "@/types/database";

const AVAILABLE_VARIABLES = [
  { key: "proprietaire_nom", label: "Nom du propri\u00e9taire" },
  { key: "logement_nom", label: "Nom du logement" },
  { key: "commission_rate", label: "Taux de commission" },
  { key: "start_date", label: "Date de d\u00e9but" },
  { key: "end_date", label: "Date de fin" },
  { key: "type_contrat", label: "Type de contrat" },
];

const SAMPLE_DATA: Record<string, string> = {
  proprietaire_nom: "Jean Dupont",
  logement_nom: "Appartement Riviera",
  commission_rate: "15",
  start_date: "01/01/2026",
  end_date: "31/12/2026",
  type_contrat: "Exclusif",
};

interface ContratTemplateFormProps {
  template?: ContratTemplate | null;
}

export function ContratTemplateForm({ template }: ContratTemplateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(template?.name ?? "");
  const [category, setCategory] = useState(template?.category ?? "GENERAL");
  const [content, setContent] = useState(template?.content ?? "");
  const [showPreview, setShowPreview] = useState(false);

  function getPreview() {
    let rendered = content;
    for (const [key, value] of Object.entries(SAMPLE_DATA)) {
      rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    return rendered;
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    if (!content.trim()) {
      toast.error("Le contenu est requis");
      return;
    }

    startTransition(async () => {
      const data = {
        name: name.trim(),
        category: category.trim() || "GENERAL",
        content: content.trim(),
      };

      const result = template
        ? await updateContratTemplate(template.id, data)
        : await createContratTemplate(data);

      if (result.success) {
        toast.success(result.message);
        router.push("/contrats/templates");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function insertVariable(key: string) {
    setContent((prev) => prev + `{{${key}}}`);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {template ? "Modifier le mod\u00e8le" : "Nouveau mod\u00e8le de contrat"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du mod\u00e8le *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Contrat de gestion standard"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Cat\u00e9gorie</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="GENERAL"
                maxLength={50}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Variables disponibles</Label>
            <p className="text-xs text-muted-foreground">
              Cliquez sur une variable pour l&apos;ins\u00e9rer dans le contenu.
              Elles seront remplac\u00e9es par les vraies valeurs lors de l&apos;utilisation.
            </p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_VARIABLES.map((v) => (
                <Badge
                  key={v.key}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => insertVariable(v.key)}
                >
                  {"{{"}
                  {v.key}
                  {"}}"}
                  <span className="ml-1 text-muted-foreground">({v.label})</span>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Contenu du mod\u00e8le *</Label>
            <textarea
              id="content"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[300px] font-mono"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="CONTRAT DE GESTION LOCATIVE&#10;&#10;Entre les soussign\u00e9s :&#10;- {{proprietaire_nom}}, ci-apr\u00e8s d\u00e9nomm\u00e9 le Propri\u00e9taire&#10;&#10;Pour le logement : {{logement_nom}}&#10;&#10;Taux de commission : {{commission_rate}}%&#10;P\u00e9riode : du {{start_date}} au {{end_date}}&#10;Type : {{type_contrat}}"
              maxLength={50000}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending
                ? "Enregistrement..."
                : template
                ? "Mettre \u00e0 jour"
                : "Cr\u00e9er le mod\u00e8le"}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? "Masquer l'aper\u00e7u" : "Aper\u00e7u"}
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => router.push("/contrats/templates")}
            >
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>

      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Aper\u00e7u (avec donn\u00e9es d&apos;exemple)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg border">
              {getPreview() || (
                <span className="text-muted-foreground italic">
                  Saisissez du contenu pour voir l&apos;aper\u00e7u
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
