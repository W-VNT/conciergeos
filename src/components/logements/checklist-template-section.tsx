"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ClipboardList, Camera, Sparkles, Check } from "lucide-react";
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

const MISSION_TYPES: MissionType[] = ["MENAGE", "CHECKIN", "CHECKOUT"];

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
  const [activeType, setActiveType] = useState<MissionType>("MENAGE");
  const [selectedSuggestions, setSelectedSuggestions] = useState<Suggestion[]>([]);
  const [addingSuggestions, setAddingSuggestions] = useState(false);

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
    if (templateResult.templates) setTemplates(templateResult.templates as Template[]);
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
    if (!confirm("Supprimer cet item ?")) return;
    const result = await deleteLogementChecklistItem(itemId, logementId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Item supprimé");
      load();
    }
  }

  async function handleAddSuggestions(type: MissionType) {
    if (selectedSuggestions.length === 0) return;
    setAddingSuggestions(true);
    let errors = 0;
    for (const s of selectedSuggestions) {
      const result = await addLogementChecklistItem(logementId, type, {
        titre: s.titre,
        categorie: s.categorie,
        photo_requise: false,
      });
      if (result.error) errors++;
    }
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
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Checklists missions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="MENAGE" onValueChange={() => setSelectedSuggestions([])}>
          <TabsList className="h-11 mb-4">
            {MISSION_TYPES.map((type) => {
              const template = getTemplateForType(type);
              const count = template?.items.length ?? 0;
              return (
                <TabsTrigger key={type} value={type} className="gap-2 px-5">
                  {MISSION_TYPE_LABELS[type]}
                  {count > 0 && (
                    <span className="text-xs font-medium bg-primary/15 text-primary rounded-full px-1.5 py-0.5 leading-none">{count}</span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {MISSION_TYPES.map((type) => {
            const template = getTemplateForType(type);
            const items = template?.items ?? [];
            const grouped = groupByCategory(items);
            const suggestions = buildSuggestions(items, type);
            const inventorySuggestions = suggestions.filter((s) => s.fromInventory);
            const standardSuggestions = suggestions.filter((s) => !s.fromInventory);

            return (
              <TabsContent key={type} value={type}>
                {loading ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Chargement…</p>
                ) : (
                  <div className="space-y-5">
                    {/* Suggestions intelligentes */}
                    {suggestions.length > 0 && (
                      <div className="rounded-lg border border-dashed p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">Suggestions</p>
                          <p className="text-xs text-muted-foreground">— basées sur votre inventaire et les standards</p>
                        </div>

                        {inventorySuggestions.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Depuis votre inventaire</p>
                            <div className="flex flex-wrap gap-1.5">
                              {inventorySuggestions.map((s) => {
                                const isSelected = !!selectedSuggestions.find((x) => x.titre === s.titre);
                                return (
                                  <button
                                    key={s.titre}
                                    type="button"
                                    onClick={() => toggleSuggestion(s)}
                                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                                      isSelected
                                        ? "border-primary bg-primary/10 text-primary font-medium"
                                        : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
                                    }`}
                                  >
                                    {isSelected && <Check className="h-3 w-3" />}
                                    {s.titre}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {standardSuggestions.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Standards</p>
                            <div className="flex flex-wrap gap-1.5">
                              {standardSuggestions.map((s) => {
                                const isSelected = !!selectedSuggestions.find((x) => x.titre === s.titre);
                                return (
                                  <button
                                    key={s.titre}
                                    type="button"
                                    onClick={() => toggleSuggestion(s)}
                                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                                      isSelected
                                        ? "border-primary bg-primary/10 text-primary font-medium"
                                        : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
                                    }`}
                                  >
                                    {isSelected && <Check className="h-3 w-3" />}
                                    {s.titre}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {selectedSuggestions.length > 0 && (
                          <Button size="sm" onClick={() => handleAddSuggestions(type)} disabled={addingSuggestions}>
                            {addingSuggestions
                              ? "Ajout…"
                              : `Ajouter ${selectedSuggestions.length} item${selectedSuggestions.length > 1 ? "s" : ""}`}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Items configurés */}
                    {items.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Aucun item configuré — sélectionnez des suggestions ou ajoutez manuellement.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(grouped).map(([cat, catItems]) => (
                          <div key={cat}>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{cat}</p>
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
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item, type)}>
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(item.id)}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button variant="outline" size="sm" onClick={() => openAdd(type)}>
                      <Plus className="h-4 w-4 mr-2" /> Ajouter manuellement
                    </Button>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Modifier l'item" : `Ajouter un item — ${MISSION_TYPE_LABELS[activeType]}`}
              </DialogTitle>
            </DialogHeader>
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
                  className="h-4 w-4 rounded border-gray-300"
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
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
