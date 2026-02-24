"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { FileText, Plus, Pencil, Trash2, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  createIncidentTemplate,
  updateIncidentTemplate,
  deleteIncidentTemplate,
} from "@/lib/actions/incident-templates";
import { INCIDENT_CATEGORY_LABELS } from "@/types/database";
import type { IncidentResponseTemplate } from "@/types/database";

interface Props {
  organisationId: string;
  isAdmin: boolean;
  onApply?: (content: string) => void;
  templates: IncidentResponseTemplate[];
}

const CATEGORY_OPTIONS = Object.entries(INCIDENT_CATEGORY_LABELS) as [string, string][];

export function ResponseTemplatesSection({
  organisationId,
  isAdmin: admin,
  onApply,
  templates: initialTemplates,
}: Props) {
  const [templates, setTemplates] = useState<IncidentResponseTemplate[]>(initialTemplates);
  const [collapsed, setCollapsed] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<IncidentResponseTemplate | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<string>("");
  const [formContent, setFormContent] = useState("");

  function resetForm() {
    setFormName("");
    setFormCategory("");
    setFormContent("");
    setEditingTemplate(null);
  }

  function openCreateSheet() {
    resetForm();
    setSheetOpen(true);
  }

  function openEditSheet(template: IncidentResponseTemplate) {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormCategory(template.category ?? "");
    setFormContent(template.content);
    setSheetOpen(true);
  }

  function handleSheetClose(open: boolean) {
    if (!open) {
      resetForm();
    }
    setSheetOpen(open);
  }

  function handleSubmit() {
    if (!formName.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    if (!formContent.trim()) {
      toast.error("Le contenu est requis");
      return;
    }

    startTransition(async () => {
      const payload = {
        name: formName.trim(),
        category: formCategory || undefined,
        content: formContent.trim(),
      };

      if (editingTemplate) {
        const result = await updateIncidentTemplate(editingTemplate.id, payload);
        if (result.success) {
          toast.success(result.message ?? "Modèle mis à jour");
          setTemplates((prev) =>
            prev.map((t) =>
              t.id === editingTemplate.id
                ? {
                    ...t,
                    name: payload.name,
                    category: (payload.category as IncidentResponseTemplate["category"]) ?? null,
                    content: payload.content,
                  }
                : t
            )
          );
          setSheetOpen(false);
          resetForm();
        } else {
          toast.error(result.error ?? "Erreur");
        }
      } else {
        const result = await createIncidentTemplate(payload);
        if (result.success && result.data) {
          toast.success(result.message ?? "Modèle créé");
          setTemplates((prev) => [
            ...prev,
            {
              id: result.data!.id,
              organisation_id: organisationId,
              name: payload.name,
              category: (payload.category as IncidentResponseTemplate["category"]) ?? null,
              content: payload.content,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);
          setSheetOpen(false);
          resetForm();
        } else {
          toast.error(result.error ?? "Erreur");
        }
      }
    });
  }

  function handleDelete(template: IncidentResponseTemplate) {
    if (!confirm(`Supprimer le modèle "${template.name}" ?`)) return;

    startTransition(async () => {
      const result = await deleteIncidentTemplate(template.id);
      if (result.success) {
        toast.success(result.message ?? "Modèle supprimé");
        setTemplates((prev) => prev.filter((t) => t.id !== template.id));
      } else {
        toast.error(result.error ?? "Erreur");
      }
    });
  }

  function handleApply(content: string) {
    if (onApply) {
      onApply(content);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(content).then(() => {
        toast.success("Contenu copié dans le presse-papiers");
      }).catch(() => {
        toast.error("Impossible de copier le contenu");
      });
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setCollapsed((c) => !c)}
        >
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Modèles de réponse
              <Badge variant="secondary" className="ml-1">
                {templates.length}
              </Badge>
            </span>
            {collapsed ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            )}
          </CardTitle>
        </CardHeader>

        {!collapsed && (
          <CardContent className="space-y-3">
            {templates.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aucun modèle de réponse pour le moment.
              </p>
            )}

            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{template.name}</span>
                    {template.category && (
                      <Badge variant="outline" className="text-xs">
                        {INCIDENT_CATEGORY_LABELS[
                          template.category as keyof typeof INCIDENT_CATEGORY_LABELS
                        ] ?? template.category}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {template.content}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleApply(template.content)}
                    title="Appliquer"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {admin && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditSheet(template)}
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(template)}
                        disabled={isPending}
                        className="text-destructive hover:text-destructive"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {admin && (
              <Button
                variant="outline"
                size="sm"
                onClick={openCreateSheet}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un modèle
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      <Sheet open={sheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingTemplate ? "Modifier le modèle" : "Nouveau modèle de réponse"}
            </SheetTitle>
            <SheetDescription>
              {editingTemplate
                ? "Modifiez les informations du modèle de réponse."
                : "Créez un modèle de réponse réutilisable pour les incidents."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nom</Label>
              <Input
                id="template-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Réponse fuite d'eau"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-category">Catégorie (optionnel)</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger id="template-category">
                  <SelectValue placeholder="Toutes catégories" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formCategory && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormCategory("")}
                  className="text-xs text-muted-foreground"
                >
                  Retirer la catégorie
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-content">Contenu</Label>
              <Textarea
                id="template-content"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Contenu du modèle de réponse..."
                rows={8}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="w-full"
            >
              {isPending
                ? "Enregistrement..."
                : editingTemplate
                ? "Mettre à jour"
                : "Créer le modèle"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
