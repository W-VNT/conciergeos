"use client";

import { useState } from "react";
import type { Organisation } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateOrganisation, uploadOrganisationLogo, deleteOrganisationLogo } from "@/lib/actions/organisation";
import { Building2, Upload, X } from "lucide-react";

interface Props {
  organisation: Organisation;
}

export default function OrganisationSettings({ organisation }: Props) {
  const [name, setName] = useState(organisation.name);
  const [city, setCity] = useState(organisation.city || "");
  const [logoUrl, setLogoUrl] = useState(organisation.logo_url);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await updateOrganisation({
      name,
      city: city || null,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Organisation mise à jour");
    }

    setLoading(false);
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
    </div>
  );
}
