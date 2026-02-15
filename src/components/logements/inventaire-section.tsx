"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import type { Equipement, EquipementCategorie, EquipementEtat } from "@/types/database";
import { EQUIPEMENT_CATEGORIE_LABELS, EQUIPEMENT_ETAT_LABELS } from "@/types/database";
import { getEquipements, createEquipement, updateEquipement, deleteEquipement } from "@/lib/actions/equipements";

interface Props {
  logementId: string;
}

export function InventaireSection({ logementId }: Props) {
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Equipement | null>(null);

  // Form state
  const [categorie, setCategorie] = useState<EquipementCategorie>("AUTRE");
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
      setCategorie("AUTRE");
      setNom("");
      setQuantite(1);
      setEtat("BON");
      setNotes("");
    }
    setDialogOpen(true);
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Modifier" : "Ajouter"} un équipement</DialogTitle>
                <DialogDescription>
                  Gérez l'inventaire de ce logement
                </DialogDescription>
              </DialogHeader>
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
                  <Input value={nom} onChange={(e) => setNom(e.target.value)} required placeholder="Ex: Lave-vaisselle" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantité</Label>
                    <Input type="number" min={1} value={quantite} onChange={(e) => setQuantite(parseInt(e.target.value))} />
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
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Informations supplémentaires" />
                </div>

                <Button type="submit" className="w-full">{editing ? "Mettre à jour" : "Ajouter"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Chargement...</p>
        ) : equipements.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Aucun équipement. Cliquez sur "Ajouter" pour commencer.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEquipements).map(([cat, items]) => (
              <div key={cat}>
                <h3 className="font-semibold mb-3">{EQUIPEMENT_CATEGORIE_LABELS[cat as EquipementCategorie]}</h3>
                <div className="space-y-2">
                  {items.map((eq) => (
                    <div key={eq.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{eq.nom}</span>
                          <Badge variant={eq.etat === "BON" ? "default" : eq.etat === "MOYEN" ? "secondary" : "destructive"}>
                            {EQUIPEMENT_ETAT_LABELS[eq.etat]}
                          </Badge>
                          {eq.quantite > 1 && <span className="text-sm text-muted-foreground">× {eq.quantite}</span>}
                        </div>
                        {eq.notes && <p className="text-sm text-muted-foreground mt-1">{eq.notes}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(eq)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(eq.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
