"use client";

import { useState } from "react";
import type { Organisation } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { updateOrganisation, uploadOrganisationLogo, deleteOrganisationLogo, deleteOrganisation } from "@/lib/actions/organisation";
import { Building2, Upload, X, Trash2, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const STATUT_JURIDIQUE_OPTIONS = [
  { value: "SARL", label: "SARL" },
  { value: "SAS", label: "SAS / SASU" },
  { value: "EURL", label: "EURL" },
  { value: "SCI", label: "SCI" },
  { value: "EI", label: "Entreprise individuelle" },
  { value: "AUTRE", label: "Autre" },
];

function codeToStatutJuridique(code: string): string {
  const n = parseInt(code, 10);
  if (n >= 1000 && n <= 1099) return "EI";
  if (n >= 1000 && n <= 1999) return "EURL";
  if (n >= 5200 && n <= 5299) return "SARL";
  if (n >= 5500 && n <= 5599) return "SARL";
  if (n >= 5700 && n <= 5799) return "SAS";
  if (n >= 6500 && n <= 6599) return "SCI";
  return "AUTRE";
}

interface Props {
  organisation: Organisation;
}

export default function OrganisationSettings({ organisation }: Props) {
  const router = useRouter();
  const [name, setName] = useState(organisation.name);
  const [city, setCity] = useState(organisation.city || "");
  const [addressLine1, setAddressLine1] = useState(organisation.address_line1 || "");
  const [postalCode, setPostalCode] = useState(organisation.postal_code || "");
  const [siret, setSiret] = useState(organisation.siret || "");
  const [phone, setPhone] = useState(organisation.phone || "");
  const [email, setEmail] = useState(organisation.email || "");
  const [statutJuridique, setStatutJuridique] = useState(organisation.statut_juridique || "");
  const [logoUrl, setLogoUrl] = useState(organisation.logo_url);
  const [loading, setLoading] = useState(false);
  const [siretLoading, setSiretLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmationName, setConfirmationName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteLogoOpen, setDeleteLogoOpen] = useState(false);

  const siretClean = siret.replace(/\s/g, "");
  const canLookup = siretClean.length === 9 || siretClean.length === 14;

  async function lookupSiret() {
    setSiretLoading(true);
    try {
      const res = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${siretClean}&limite=1`
      );
      if (!res.ok) throw new Error("Erreur API");
      const data = await res.json();
      const result = data?.results?.[0];
      if (!result) {
        toast.error("Aucune entreprise trouvée pour ce SIRET/SIREN");
        return;
      }
      const siege = result.siege ?? {};
      setName(result.nom_complet ?? name);
      setAddressLine1(siege.adresse ?? "");
      setPostalCode(siege.code_postal ?? "");
      setCity(siege.libelle_commune ?? "");
      if (result.nature_juridique) {
        setStatutJuridique(codeToStatutJuridique(result.nature_juridique));
      }
      toast.success("Informations importées depuis l'annuaire officiel");
    } catch {
      toast.error("Impossible de récupérer les informations");
    } finally {
      setSiretLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateOrganisation({
        name,
        city: city || null,
        address_line1: addressLine1 || null,
        postal_code: postalCode || null,
        siret: siret || null,
        phone: phone || null,
        email: email || null,
        statut_juridique: statutJuridique || null,
      });
      toast.success("Organisation mise à jour");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Le fichier doit être une image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const publicUrl = await uploadOrganisationLogo(formData);
      setLogoUrl(publicUrl);
      toast.success("Logo mis à jour");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleDeleteLogo() {
    setDeleteLogoOpen(true);
  }

  async function confirmDeleteLogo() {
    try {
      setUploading(true);
      await deleteOrganisationLogo();
      setLogoUrl(null);
      toast.success("Logo supprimé");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erreur lors de la suppression");
    } finally {
      setUploading(false);
      setDeleteLogoOpen(false);
    }
  }

  async function handleDeleteOrganisation() {
    setDeleting(true);
    try {
      await deleteOrganisation(confirmationName);
      toast.success("Organisation supprimée");
      router.push("/login");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setConfirmationName("");
    }
  }

  return (
    <div className="space-y-8">
      {/* Logo Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Logo de l'organisation</h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-border">
              {logoUrl ? (
                <Image src={logoUrl} alt={name} fill className="object-cover" />
              ) : (
                <Building2 className="h-12 w-12 text-primary/50" />
              )}
            </div>
            {logoUrl && !uploading && (
              <button
                onClick={handleDeleteLogo}
                className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-md after:content-[''] after:absolute after:-inset-[10px]"
                aria-label="Supprimer le logo"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/svg+xml"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
              <Button type="button" variant="outline" size="sm" asChild disabled={uploading}>
                <span className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {logoUrl ? "Changer le logo" : "Ajouter un logo"}
                </span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground">JPG, PNG, SVG. Max 5 MB</p>
          </div>
        </div>
      </div>

      {/* Organisation Info */}
      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-1">Informations</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Ces informations apparaissent sur les contrats PDF générés.
        </p>
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ── Identification ── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Identification</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nom de l'organisation *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ma Conciergerie"
                />
              </div>
              <div className="space-y-2">
                <Label>Forme juridique</Label>
                <Select
                  value={statutJuridique || "none"}
                  onValueChange={(v) => setStatutJuridique(v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non renseigné</SelectItem>
                    {STATUT_JURIDIQUE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siret">SIRET / SIREN</Label>
                <div className="flex gap-2">
                  <Input
                    id="siret"
                    value={siret}
                    onChange={(e) => setSiret(e.target.value)}
                    placeholder="000 000 000 00000"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={lookupSiret}
                    disabled={!canLookup || siretLoading}
                    className="shrink-0"
                  >
                    {siretLoading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <><Sparkles className="h-4 w-4 mr-1.5" />Compléter</>}
                  </Button>
                </div>
                {canLookup && (
                  <p className="text-xs text-muted-foreground">
                    Cliquez sur Compléter pour importer depuis l'annuaire officiel
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Adresse du siège ── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Adresse du siège</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address_line1">Adresse</Label>
                <Input
                  id="address_line1"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="12 rue de la Paix"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Code postal</Label>
                <Input
                  id="postal_code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="75001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Paris"
                />
              </div>
            </div>
          </div>

          {/* ── Contact ── */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Contact</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 6 00 00 00 00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@maconciergerie.fr"
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="border-t border-destructive/30 pt-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-destructive mb-2">Zone de danger</h2>
            <p className="text-sm text-muted-foreground mb-4">
              La suppression de l'organisation est <strong>irréversible</strong>.
              Toutes les données seront définitivement supprimées :
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-4">
              <li>Tous les propriétaires, logements et réservations</li>
              <li>Toutes les missions, incidents et contrats</li>
              <li>Tous les revenus et données financières</li>
              <li>Tous les membres de l'équipe perdront l'accès</li>
              <li>Tous les fichiers uploadés (photos, documents)</li>
            </ul>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer définitivement l'organisation
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Supprimer l'organisation
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p className="font-semibold">
                Cette action est irréversible et supprimera définitivement :
              </p>
              <ul className="text-sm list-disc list-inside space-y-1 text-muted-foreground">
                <li>Toutes les données de l'organisation</li>
                <li>Tous les utilisateurs et leurs accès</li>
                <li>Tous les fichiers uploadés</li>
              </ul>
              <p className="text-sm font-medium pt-2">
                Pour confirmer, tapez le nom de l'organisation :{" "}
                <span className="font-bold text-foreground">{organisation.name}</span>
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={organisation.name}
              value={confirmationName}
              onChange={(e) => setConfirmationName(e.target.value)}
              autoComplete="off"
              className="border-destructive/50 focus-visible:ring-destructive"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDeleteDialogOpen(false); setConfirmationName(""); }}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrganisation}
              disabled={confirmationName !== organisation.name || deleting}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Suppression..." : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteLogoOpen} onOpenChange={setDeleteLogoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le logo ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le logo de l'organisation sera supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteLogo} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
