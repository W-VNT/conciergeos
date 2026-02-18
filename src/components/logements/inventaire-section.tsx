"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Package, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { Equipement, EquipementCategorie, EquipementEtat } from "@/types/database";
import { EQUIPEMENT_CATEGORIE_LABELS, EQUIPEMENT_ETAT_LABELS } from "@/types/database";
import { getEquipements, createEquipement, updateEquipement, deleteEquipement } from "@/lib/actions/equipements";

// ─── Suggestions pré-définies ─────────────────────────────────────────────────
const SUGGESTIONS: Record<EquipementCategorie, string[]> = {
  ELECTROMENAGER: [
    "Réfrigérateur", "Congélateur", "Lave-linge", "Sèche-linge",
    "Lave-vaisselle", "Four", "Micro-ondes", "Plaque de cuisson",
    "Hotte aspirante", "Télévision", "Climatiseur", "Aspirateur",
    "Fer à repasser", "Cafetière", "Bouilloire", "Grille-pain",
    "Sèche-cheveux",
  ],
  MOBILIER: [
    "Canapé", "Table basse", "Table à manger", "Chaises",
    "Lit simple", "Lit double", "Matelas", "Armoire",
    "Commode", "Bureau", "Chaise de bureau", "Table de nuit",
    "Étagère", "Miroir", "Bibliothèque",
  ],
  LINGE: [
    "Draps 1 place", "Draps 2 places", "Couette 1 place", "Couette 2 places",
    "Oreillers", "Serviettes de bain", "Serviettes de toilette",
    "Tapis de bain", "Torchons", "Peignoirs",
  ],
  AUTRE: [
    "Détecteur de fumée", "Extincteur", "Trousse de secours",
    "Balai & serpillère", "Poubelles", "Cintres", "Boîte à outils",
    "Parasol", "Barbecue", "Vélos", "Table de jardin", "Chaises de jardin",
  ],
  CONSOMMABLE: [
    "Papier toilette", "Gel douche", "Shampoing", "Savon",
    "Liquide vaisselle", "Éponges", "Sacs poubelle", "Capsules café",
    "Sel & poivre", "Huile d'olive", "Sucre", "Thé & infusions",
  ],
};

interface Props {
  logementId: string;
}

type SuggestionItem = { nom: string; categorie: EquipementCategorie };

export function InventaireSection({ logementId }: Props) {
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Equipement | null>(null);
  const [submittingMulti, setSubmittingMulti] = useState(false);

  // Multi-sélection de suggestions
  const [selected, setSelected] = useState<SuggestionItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  function toggleCat(cat: string) {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  // Form state (ajout unitaire / édition)
  const [categorie, setCategorie] = useState<EquipementCategorie>("ELECTROMENAGER");
  const [nom, setNom] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [etat, setEtat] = useState<EquipementEtat>("BON");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadEquipements();
  }, [logementId]);

  async function loadEquipements() {
    setLoading(true);
    const result = await getEquipements(logementId);
    if (result.equipements) {
      setEquipements(result.equipements);
      // Fermer toutes les catégories sauf la première
      const cats = Array.from(new Set(result.equipements.map((e) => e.categorie)));
      setCollapsedCats(new Set(cats.slice(1)));
    }
    setLoading(false);
  }

  function openDialog(equipement?: Equipement) {
    if (equipement) {
      setEditing(equipement);
      setCategorie(equipement.categorie);
      setNom(equipement.nom);
      setQuantite(equipement.quantite);
      setEtat(equipement.etat);
      setNotes(equipement.notes || "");
    } else {
      setEditing(null);
      setCategorie("ELECTROMENAGER");
      setNom("");
      setQuantite(1);
      setEtat("BON");
      setNotes("");
      setSelected([]);
      setShowForm(false);
    }
    setDialogOpen(true);
  }

  function toggleSuggestion(item: string, cat: EquipementCategorie) {
    setSelected((prev) => {
      const exists = prev.find((s) => s.nom === item && s.categorie === cat);
      if (exists) return prev.filter((s) => !(s.nom === item && s.categorie === cat));
      return [...prev, { nom: item, categorie: cat }];
    });
  }

  async function handleSubmitMultiple() {
    if (selected.length === 0) return;
    setSubmittingMulti(true);
    let errors = 0;
    for (const item of selected) {
      const result = await createEquipement({
        logement_id: logementId,
        categorie: item.categorie,
        nom: item.nom,
        quantite: 1,
        etat: "BON",
        notes: "",
      });
      if (result.error) errors++;
    }
    setSubmittingMulti(false);
    if (errors > 0) {
      toast.error(`${errors} équipement(s) n'ont pas pu être ajoutés`);
    } else {
      toast.success(`${selected.length} équipement${selected.length > 1 ? "s" : ""} ajouté${selected.length > 1 ? "s" : ""}`);
    }
    setSelected([]);
    setDialogOpen(false);
    loadEquipements();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data = { logement_id: logementId, categorie, nom, quantite, etat, notes };

    const result = editing
      ? await updateEquipement(editing.id, data)
      : await createEquipement(data);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(editing ? "Équipement mis à jour" : "Équipement ajouté");
      setDialogOpen(false);
      loadEquipements();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet équipement ?")) return;

    const result = await deleteEquipement(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Équipement supprimé");
      loadEquipements();
    }
  }

  const groupedEquipements = equipements.reduce((acc, eq) => {
    if (!acc[eq.categorie]) acc[eq.categorie] = [];
    acc[eq.categorie].push(eq);
    return acc;
  }, {} as Record<EquipementCategorie, Equipement[]>);

  // Noms déjà dans l'inventaire (pour griser les suggestions déjà ajoutées)
  const existingNames = new Set(equipements.map((e) => e.nom.toLowerCase()));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventaire & Équipements
            </CardTitle>
            <CardDescription>{equipements.length} équipement{equipements.length > 1 ? "s" : ""}</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Modifier" : "Ajouter"} un équipement</DialogTitle>
                <DialogDescription>
                  {editing ? "Modifiez les informations de cet équipement." : "Choisissez parmi les suggestions ou saisissez un nom libre."}
                </DialogDescription>
              </DialogHeader>

              {/* ── Suggestions rapides (mode ajout uniquement) ── */}
              {!editing && (
                <div className="space-y-3">
                  {(Object.entries(SUGGESTIONS) as [EquipementCategorie, string[]][]).map(([cat, items]) => (
                    <div key={cat}>
                      <p className="text-xs text-muted-foreground mb-1.5">{EQUIPEMENT_CATEGORIE_LABELS[cat]}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map((item) => {
                          const alreadyAdded = existingNames.has(item.toLowerCase());
                          const isSelected = !!selected.find((s) => s.nom === item && s.categorie === cat);
                          return (
                            <button
                              key={item}
                              type="button"
                              disabled={alreadyAdded}
                              onClick={() => toggleSuggestion(item, cat)}
                              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                                alreadyAdded
                                  ? "border-border text-muted-foreground/40 bg-muted cursor-not-allowed line-through"
                                  : isSelected
                                  ? "border-primary bg-primary/10 text-primary font-medium"
                                  : "border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-foreground"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                              {item}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {selected.length > 0 && (
                    <Button
                      type="button"
                      className="w-full"
                      onClick={handleSubmitMultiple}
                      disabled={submittingMulti}
                    >
                      {submittingMulti
                        ? "Ajout en cours..."
                        : `Ajouter ${selected.length} équipement${selected.length > 1 ? "s" : ""}`}
                    </Button>
                  )}

                  {/* Toggle formulaire manuel */}
                  <button
                    type="button"
                    onClick={() => setShowForm((v) => !v)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showForm ? "rotate-180" : ""}`} />
                    {showForm ? "Masquer le formulaire" : "Ajouter un équipement personnalisé"}
                  </button>
                </div>
              )}

              {/* ── Formulaire ── */}
              {(editing || showForm) && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select value={categorie} onValueChange={(v) => setCategorie(v as EquipementCategorie)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EQUIPEMENT_CATEGORIE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                    placeholder="Ex: Lave-vaisselle"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantité</Label>
                    <Input
                      type="number"
                      min={1}
                      value={quantite}
                      onChange={(e) => setQuantite(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>État</Label>
                    <Select value={etat} onValueChange={(v) => setEtat(v as EquipementEtat)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EQUIPEMENT_ETAT_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes (optionnel)</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Informations supplémentaires"
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editing ? "Mettre à jour" : "Ajouter"}
                </Button>
              </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Chargement...</p>
        ) : equipements.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucun équipement. Cliquez sur &quot;Ajouter&quot; pour commencer.
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEquipements).map(([cat, items]) => (
              <div key={cat}>
                <button
                  type="button"
                  onClick={() => toggleCat(cat)}
                  className="w-full flex items-center justify-between mb-3 group"
                >
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    {EQUIPEMENT_CATEGORIE_LABELS[cat as EquipementCategorie]}
                    <span className="normal-case text-xs font-normal">({items.length})</span>
                  </h3>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${collapsedCats.has(cat) ? "-rotate-90" : ""}`} />
                </button>
                {!collapsedCats.has(cat) && (
                <div className="space-y-2">
                  {items.map((eq) => (
                    <div key={eq.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{eq.nom}</span>
                          <Badge variant={eq.etat === "BON" ? "default" : eq.etat === "MOYEN" ? "secondary" : "destructive"}>
                            {EQUIPEMENT_ETAT_LABELS[eq.etat]}
                          </Badge>
                          {eq.quantite > 1 && (
                            <span className="text-sm text-muted-foreground">× {eq.quantite}</span>
                          )}
                        </div>
                        {eq.notes && <p className="text-sm text-muted-foreground mt-1">{eq.notes}</p>}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(eq)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(eq.id)}>
                          <Trash2 className="h-4 w-4" />
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
      </CardContent>
    </Card>
  );
}
