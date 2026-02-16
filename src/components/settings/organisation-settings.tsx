"use client";

import { useState } from "react";
import type { Organisation } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateOrganisation, uploadOrganisationLogo, deleteOrganisationLogo, deleteOrganisation } from "@/lib/actions/organisation";
import { Building2, Upload, X, Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface Props {
  organisation: Organisation;
}

export default function OrganisationSettings({ organisation }: Props) {
  const router = useRouter();
  const [name, setName] = useState(organisation.name);
  const [city, setCity] = useState(organisation.city || "");
  const [logoUrl, setLogoUrl] = useState(organisation.logo_url);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmationName, setConfirmationName] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await updateOrganisation({
        name,
        city: city || undefined,
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

    // Validation
    if (!file.type.startsWith("image/")) {
      toast.error("Le fichier doit être une image");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
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
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDeleteLogo() {
    if (!confirm("Supprimer le logo ?")) return;

    try {
      setUploading(true);
      await deleteOrganisationLogo();
      setLogoUrl(null);
      toast.success("Logo supprimé");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la suppression");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteOrganisation() {
    setDeleting(true);

    try {
      await deleteOrganisation(confirmationName);
      toast.success("Organisation supprimée");
      // User is automatically signed out, redirect happens via auth callback
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setConfirmationName("");
    }
  }

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Logo de l'organisation</h2>
        <div className="flex items-center gap-6">
          {/* Logo preview */}
          <div className="relative">
            <div className="h-24 w-24 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-border">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={name}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <Building2 className="h-12 w-12 text-primary/50" />
              )}
            </div>
            {logoUrl && !uploading && (
              <button
                onClick={handleDeleteLogo}
                className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-md"
                title="Supprimer le logo"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Upload button */}
          <div className="flex flex-col gap-2">
            <label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/svg+xml"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                asChild
                disabled={uploading}
              >
                <span className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {logoUrl ? "Changer le logo" : "Ajouter un logo"}
                </span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, SVG. Max 5 MB
            </p>
          </div>
        </div>
      </div>

      {/* Organisation Info */}
      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Informations</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l'organisation</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ma Conciergerie"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Paris"
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="border-t border-destructive/30 pt-6 mt-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-destructive mb-2">
                Zone de danger
              </h2>
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
              onClick={() => {
                setDeleteDialogOpen(false);
                setConfirmationName("");
              }}
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
    </div>
  );
}
