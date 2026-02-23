"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ClipboardList, Camera, Check, ChevronDown } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  getLogementTemplatesWithItems,
  addLogementChecklistItem,
  updateLogementChecklistItem,
  deleteLogementChecklistItem,
} from "@/lib/actions/checklists";
import { getEquipements } from "@/lib/actions/equipements";
import type { MissionType, Equipement } from "@/types/database";
import { MISSION_TYPE_LABELS } from "@/types/database";

const MISSION_TYPES: MissionType[] = ["CHECKIN", "CHECKOUT", "MENAGE"];

const CATEGORIES_SUGGESTIONS = [
  "Cuisine", "Salle de bain", "Chambre", "Salon", "Entrée",
  "Terrasse", "Vérification finale", "Linge", "Général",
];

// Mapping inventaire → suggestions checklist ménage
const EQUIPEMENT_TO_CHECKLIST: Record<string, { titre: string; categorie: string }> = {
  "draps 1 place":        { titre: "Changer les draps 1 place",                 categorie: "Linge" },
  "draps 2 places":       { titre: "Changer les draps 2 places",                categorie: "Linge" },
  "couette 1 place":      { titre: "Vérifier et aérer la couette 1 place",      categorie: "Linge" },
  "couette 2 places":     { titre: "Vérifier et aérer la couette 2 places",     categorie: "Linge" },
  "oreillers":            { titre: "Vérifier les oreillers",                     categorie: "Linge" },
  "serviettes de bain":   { titre: "Remplacer les serviettes de bain",          categorie: "Linge" },
  "serviettes de toilette": { titre: "Remplacer les serviettes de toilette",    categorie: "Linge" },
  "tapis de bain":        { titre: "Changer le tapis de bain",                  categorie: "Salle de bain" },
  "torchons":             { titre: "Changer les torchons",                       categorie: "Cuisine" },
  "peignoirs":            { titre: "Vérifier les peignoirs",                     categorie: "Linge" },
  "four":                 { titre: "Nettoyer le four",                           categorie: "Cuisine" },
  "micro-ondes":          { titre: "Nettoyer le micro-ondes",                   categorie: "Cuisine" },
  "réfrigérateur":        { titre: "Vérifier et nettoyer le réfrigérateur",     categorie: "Cuisine" },
  "congélateur":          { titre: "Vérifier le congélateur",                   categorie: "Cuisine" },
  "lave-vaisselle":       { titre: "Vider et nettoyer le lave-vaisselle",       categorie: "Cuisine" },
  "plaque de cuisson":    { titre: "Nettoyer la plaque de cuisson",             categorie: "Cuisine" },
  "hotte aspirante":      { titre: "Nettoyer le filtre de la hotte",            categorie: "Cuisine" },
  "cafetière":            { titre: "Nettoyer la cafetière",                     categorie: "Cuisine" },
  "lave-linge":           { titre: "Vérifier le lave-linge (tambour propre)",   categorie: "Général" },
  "télévision":           { titre: "Dépoussiérer la télévision",                categorie: "Salon" },
  "barbecue":             { titre: "Nettoyer le barbecue",                      categorie: "Extérieur" },
  "table de jardin":      { titre: "Nettoyer la table de jardin",               categorie: "Extérieur" },
  "parasol":              { titre: "Vérifier et replier le parasol",            categorie: "Extérieur" },
};

// Points de contrôle fixes toujours proposés pour le ménage
const STANDARD_MENAGE: { titre: string; categorie: string }[] = [
  { titre: "Aspirer et laver les sols", categorie: "Général" },
  { titre: "Dépoussiérer les surfaces", categorie: "Général" },
  { titre: "Nettoyer les WC", categorie: "Salle de bain" },
  { titre: "Nettoyer la douche / baignoire", categorie: "Salle de bain" },
  { titre: "Nettoyer les miroirs", categorie: "Salle de bain" },
  { titre: "Remettre les produits d'accueil", categorie: "Salle de bain" },
  { titre: "Nettoyer les plans de travail", categorie: "Cuisine" },
  { titre: "Vider les poubelles", categorie: "Général" },
  { titre: "Vérifier l'état général du logement", categorie: "Vérification finale" },
  { titre: "Prendre des photos du logement propre", categorie: "Vérification finale" },
  { titre: "Fermer les fenêtres et volets", categorie: "Vérification finale" },
  { titre: "Sécuriser le logement (clé / boîte à clés)", categorie: "Vérification finale" },
];

// Mapping inventaire → suggestions checklist check-in
const EQUIPEMENT_TO_CHECKIN: Record<string, { titre: string; categorie: string }> = {
  "télévision":        { titre: "Expliquer la télévision",          categorie: "Équipements" },
  "four":              { titre: "Expliquer le four",                 categorie: "Équipements" },
  "micro-ondes":       { titre: "Expliquer le micro-ondes",         categorie: "Équipements" },
  "lave-linge":        { titre: "Expliquer le lave-linge",          categorie: "Équipements" },
  "lave-vaisselle":    { titre: "Expliquer le lave-vaisselle",      categorie: "Équipements" },
  "plaque de cuisson": { titre: "Expliquer la plaque de cuisson",   categorie: "Équipements" },
  "barbecue":          { titre: "Expliquer le barbecue",            categorie: "Équipements" },
  "climatisation":     { titre: "Expliquer la climatisation",       categorie: "Équipements" },
  "chauffage":         { titre: "Expliquer le chauffage",           categorie: "Équipements" },
  "jacuzzi":           { titre: "Expliquer le jacuzzi",             categorie: "Équipements" },
  "piscine":           { titre: "Expliquer la piscine (règles)",    categorie: "Extérieur" },
  "alarme":            { titre: "Expliquer le système d'alarme",    categorie: "Sécurité" },
};

const STANDARD_CHECKIN: { titre: string; categorie: string }[] = [
  { titre: "Vérifier que le logement est prêt", categorie: "Préparation" },
  { titre: "Remettre les clés / ouvrir la boîte à clés", categorie: "Accès" },
  { titre: "Tester la connexion WiFi", categorie: "Équipements" },
  { titre: "Vérifier les produits de bienvenue", categorie: "Accueil" },
  { titre: "Présenter le règlement intérieur", categorie: "Accueil" },
  { titre: "Vérifier la literie (propre, en place)", categorie: "Chambre" },
  { titre: "Prendre des photos de l'état d'entrée", categorie: "Vérification finale" },
];

// Mapping inventaire → suggestions checklist check-out
const EQUIPEMENT_TO_CHECKOUT: Record<string, { titre: string; categorie: string }> = {
  "télévision":           { titre: "Vérifier la télévision (état, fonctionne)",     categorie: "Équipements" },
  "réfrigérateur":        { titre: "Vérifier le réfrigérateur (vidé, propre)",      categorie: "Cuisine" },
  "congélateur":          { titre: "Vérifier le congélateur (vidé)",                categorie: "Cuisine" },
  "four":                 { titre: "Vérifier l'état du four",                       categorie: "Cuisine" },
  "micro-ondes":          { titre: "Vérifier l'état du micro-ondes",               categorie: "Cuisine" },
  "lave-vaisselle":       { titre: "Vérifier le lave-vaisselle (vidé)",            categorie: "Cuisine" },
  "lave-linge":           { titre: "Vérifier le lave-linge (vide, propre)",        categorie: "Général" },
  "draps 1 place":        { titre: "Compter et vérifier les draps 1 place",        categorie: "Linge" },
  "draps 2 places":       { titre: "Compter et vérifier les draps 2 places",       categorie: "Linge" },
  "serviettes de bain":   { titre: "Compter et vérifier les serviettes de bain",   categorie: "Linge" },
  "serviettes de toilette": { titre: "Compter les serviettes de toilette",         categorie: "Linge" },
  "barbecue":             { titre: "Vérifier l'état du barbecue",                  categorie: "Extérieur" },
  "piscine":              { titre: "Vérifier l'état de la piscine",               categorie: "Extérieur" },
  "jacuzzi":              { titre: "Vérifier l'état du jacuzzi",                   categorie: "Extérieur" },
  "vaisselle":            { titre: "Vérifier la vaisselle (rien de cassé/manquant)", categorie: "Cuisine" },
};

const STANDARD_CHECKOUT: { titre: string; categorie: string }[] = [
  { titre: "Récupérer les clés", categorie: "Accès" },
  { titre: "Vérifier chaque pièce", categorie: "Vérification finale" },
  { titre: "Prendre des photos de l'état de sortie", categorie: "Vérification finale" },
  { titre: "Signaler les dégradations éventuelles", categorie: "Vérification finale" },
  { titre: "Fermer les fenêtres et volets", categorie: "Sécurité" },
  { titre: "Vérifier que le logement est sécurisé", categorie: "Sécurité" },
  { titre: "Vider les poubelles laissées par le voyageur", categorie: "Général" },
];

const EQUIPEMENT_MAP: Record<string, Record<string, { titre: string; categorie: string }>> = {
  MENAGE: EQUIPEMENT_TO_CHECKLIST,
  CHECKIN: EQUIPEMENT_TO_CHECKIN,
  CHECKOUT: EQUIPEMENT_TO_CHECKOUT,
};

const STANDARD_MAP: Record<string, { titre: string; categorie: string }[]> = {
  MENAGE: STANDARD_MENAGE,
  CHECKIN: STANDARD_CHECKIN,
  CHECKOUT: STANDARD_CHECKOUT,
};

interface TemplateItem {
  id: string;
  titre: string;
  categorie: string | null;
  photo_requise: boolean;
  ordre: number;
}

interface Template {
  id: string;
  type_mission: string;
  items: TemplateItem[];
}

interface Suggestion {
  titre: string;
  categorie: string;
  fromInventory: boolean; // true = issu de l'inventaire, false = standard fixe
}

interface Props {
  logementId: string;
}

export function ChecklistTemplateSection({ logementId }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateItem | null>(null);
  const [activeType, setActiveType] = useState<MissionType>("CHECKIN");
  const [selectedSuggestions, setSelectedSuggestions] = useState<Suggestion[]>([]);
  const [addingSuggestions, setAddingSuggestions] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Record<string, Set<string>>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  function toggleCat(type: string, cat: string) {
    setCollapsedCats((prev) => {
      const set = new Set(prev[type] ?? []);
      set.has(cat) ? set.delete(cat) : set.add(cat);
      return { ...prev, [type]: set };
    });
  }

  function isCatCollapsed(type: string, cat: string) {
    return collapsedCats[type]?.has(cat) ?? false;
  }

  // Form state
  const [titre, setTitre] = useState("");
  const [categorie, setCategorie] = useState("");
  const [photoRequise, setPhotoRequise] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [templateResult, equipResult] = await Promise.all([
      getLogementTemplatesWithItems(logementId),
      getEquipements(logementId),
    ]);
    if (templateResult.templates) {
      const tpls = templateResult.templates as Template[];
      setTemplates(tpls);
      // Initialiser collapse : première catégorie ouverte, autres fermées
      const initial: Record<string, Set<string>> = {};
      for (const tpl of tpls) {
        const cats = Array.from(new Set(tpl.items.map((i: TemplateItem) => i.categorie ?? "Sans catégorie")));
        initial[tpl.type_mission] = new Set(cats.slice(1));
      }
      setCollapsedCats(initial);
    }
    if (equipResult.equipements) setEquipements(equipResult.equipements);
    setLoading(false);
  }, [logementId]);

  useEffect(() => { load(); }, [load]);

  // Build suggestions based on inventory + standards for any mission type
  function buildSuggestions(currentItems: TemplateItem[], type: MissionType): Suggestion[] {
    const existingTitres = new Set(currentItems.map((i) => i.titre.toLowerCase()));
    const suggestions: Suggestion[] = [];
    const equipMap = EQUIPEMENT_MAP[type] ?? {};
    const standards = STANDARD_MAP[type] ?? [];

    // From inventory
    for (const eq of equipements) {
      const key = eq.nom.toLowerCase();
      const mapped = equipMap[key];
      if (mapped && !existingTitres.has(mapped.titre.toLowerCase())) {
        suggestions.push({ ...mapped, fromInventory: true });
      }
    }

    // Standard fixed points
    for (const s of standards) {
      if (!existingTitres.has(s.titre.toLowerCase()) && !suggestions.find((x) => x.titre === s.titre)) {
        suggestions.push({ ...s, fromInventory: false });
      }
    }

    return suggestions;
  }

  function openAdd(type: MissionType) {
    setActiveType(type);
    setEditing(null);
    setTitre("");
    setCategorie("");
    setPhotoRequise(false);
    setSelectedSuggestions([]);
    // Show form directly if no suggestions available
    const currentItems = getTemplateForType(type)?.items ?? [];
    const suggs = buildSuggestions(currentItems, type);
    setShowForm(suggs.length === 0);
    setDialogOpen(true);
  }

  function openEdit(item: TemplateItem, type: MissionType) {
    setActiveType(type);
    setEditing(item);
    setTitre(item.titre);
    setCategorie(item.categorie ?? "");
    setPhotoRequise(item.photo_requise);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titre.trim()) return;
    setSubmitting(true);

    const data = { titre: titre.trim(), categorie: categorie.trim(), photo_requise: photoRequise };
    const result = editing
      ? await updateLogementChecklistItem(editing.id, logementId, data)
      : await addLogementChecklistItem(logementId, activeType, data);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(editing ? "Item mis à jour" : "Item ajouté");
      setDialogOpen(false);
      load();
    }
    setSubmitting(false);
  }

  async function handleDelete(itemId: string) {
    const result = await deleteLogementChecklistItem(itemId, logementId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Item supprimé");
      load();
    }
    setDeleteConfirmId(null);
  }

  async function handleAddSuggestions(type: MissionType) {
    if (selectedSuggestions.length === 0) return;
    setAddingSuggestions(true);
    const results = await Promise.allSettled(
      selectedSuggestions.map((s) =>
        addLogementChecklistItem(logementId, type, {
          titre: s.titre,
          categorie: s.categorie,
          photo_requise: false,
        })
      )
    );
    const errors = results.filter(
      (r) => r.status === "rejected" || (r.status === "fulfilled" && r.value.error)
    ).length;
    setAddingSuggestions(false);
    if (errors > 0) {
      toast.error(`${errors} item(s) n'ont pas pu être ajoutés`);
    } else {
      toast.success(`${selectedSuggestions.length} item${selectedSuggestions.length > 1 ? "s" : ""} ajouté${selectedSuggestions.length > 1 ? "s" : ""}`);
    }
    setSelectedSuggestions([]);
    load();
  }

  function toggleSuggestion(s: Suggestion) {
    setSelectedSuggestions((prev) => {
      const exists = prev.find((x) => x.titre === s.titre);
      return exists ? prev.filter((x) => x.titre !== s.titre) : [...prev, s];
    });
  }

  function getTemplateForType(type: MissionType): Template | undefined {
    return templates.find((t) => t.type_mission === type);
  }

  function groupByCategory(items: TemplateItem[]): Record<string, TemplateItem[]> {
    return items.reduce((acc, item) => {
      const key = item.categorie ?? "Sans catégorie";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, TemplateItem[]>);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Checklists missions
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => openAdd(activeType)}>
            <Plus className="h-4 w-4 mr-2" /> Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Segment control custom — pas de shadow overflow */}
        <div className="flex items-center bg-muted rounded-lg p-1 gap-0.5 mb-4">
          {MISSION_TYPES.map((type) => {
            const count = getTemplateForType(type)?.items.length ?? 0;
            return (
              <button
                key={type}
                type="button"
                onClick={() => { setActiveType(type); setSelectedSuggestions([]); }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeType === type
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {MISSION_TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>

        {MISSION_TYPES.map((type) => {
          if (activeType !== type) return null;
          const template = getTemplateForType(type);
          const items = template?.items ?? [];
          const grouped = groupByCategory(items);
          return (
            <div key={type}>
              {loading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Chargement…</p>
              ) : (
                <div className="space-y-4">
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Aucun item configuré — cliquez sur "Ajouter" pour commencer.
                    </p>
                  ) : (
                      <div className="space-y-4">
                        {Object.entries(grouped).map(([cat, catItems]) => (
                          <div key={cat}>
                            <button
                              type="button"
                              onClick={() => toggleCat(type, cat)}
                              className="w-full flex items-center justify-between mb-2"
                            >
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                {cat}
                                <span className="normal-case font-normal">({catItems.length})</span>
                              </p>
                              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isCatCollapsed(type, cat) ? "-rotate-90" : ""}`} />
                            </button>
                            {!isCatCollapsed(type, cat) && (
                            <div className="space-y-1.5">
                              {catItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between p-2.5 border rounded-lg text-sm hover:bg-muted/50"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="truncate">{item.titre}</span>
                                    {item.photo_requise && (
                                      <Camera className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                    )}
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <Button variant="ghost" size="icon" className="relative h-7 w-7 after:content-[''] after:absolute after:-inset-[8px]" onClick={() => openEdit(item, type)} aria-label="Modifier">
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="relative h-7 w-7 after:content-[''] after:absolute after:-inset-[8px]" onClick={() => setDeleteConfirmId(item.id)} aria-label="Supprimer">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                </div>
              )}
            </div>
          );
        })}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-sm rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Modifier l'item" : `Ajouter — ${MISSION_TYPE_LABELS[activeType]}`}
              </DialogTitle>
            </DialogHeader>

            {/* Suggestions (mode ajout uniquement) */}
            {!editing && (() => {
              const currentItems = getTemplateForType(activeType)?.items ?? [];
              const suggs = buildSuggestions(currentItems, activeType);
              const invSuggs = suggs.filter((s) => s.fromInventory);
              const stdSuggs = suggs.filter((s) => !s.fromInventory);
              return suggs.length > 0 ? (
                <div className="space-y-3">
                  {invSuggs.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Depuis votre inventaire</p>
                      <div className="flex flex-wrap gap-1.5">
                        {invSuggs.map((s) => {
                          const isSelected = !!selectedSuggestions.find((x) => x.titre === s.titre);
                          return (
                            <button key={s.titre} type="button" onClick={() => toggleSuggestion(s)}
                              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                                isSelected ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
                              }`}>
                              {isSelected && <Check className="h-3 w-3" />}{s.titre}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {stdSuggs.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Standards</p>
                      <div className="flex flex-wrap gap-1.5">
                        {stdSuggs.map((s) => {
                          const isSelected = !!selectedSuggestions.find((x) => x.titre === s.titre);
                          return (
                            <button key={s.titre} type="button" onClick={() => toggleSuggestion(s)}
                              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                                isSelected ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
                              }`}>
                              {isSelected && <Check className="h-3 w-3" />}{s.titre}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {selectedSuggestions.length > 0 && (
                    <Button type="button" className="w-full" onClick={() => handleAddSuggestions(activeType)} disabled={addingSuggestions}>
                      {addingSuggestions ? "Ajout…" : `Ajouter ${selectedSuggestions.length} item${selectedSuggestions.length > 1 ? "s" : ""}`}
                    </Button>
                  )}
                  <button type="button" onClick={() => setShowForm((v) => !v)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showForm ? "rotate-180" : ""}`} />
                    {showForm ? "Masquer le formulaire" : "Ajouter manuellement"}
                  </button>
                </div>
              ) : null;
            })()}

            {/* Formulaire */}
            {(editing || showForm) && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titre">Tâche <span className="text-destructive">*</span></Label>
                <Input
                  id="titre"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex: Nettoyer le four"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categorie">Catégorie</Label>
                <Input
                  id="categorie"
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value)}
                  placeholder="Ex: Cuisine"
                  list="categories-list"
                />
                <datalist id="categories-list">
                  {CATEGORIES_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={photoRequise}
                  onChange={(e) => setPhotoRequise(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  Photo obligatoire
                </span>
              </label>
              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? "Enregistrement…" : editing ? "Mettre à jour" : "Ajouter"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
              </div>
            </form>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet item ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;item sera supprimé de la checklist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); if (deleteConfirmId) handleDelete(deleteConfirmId); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
