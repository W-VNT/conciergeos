"use client";

import { useState } from "react";
import { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateProfile } from "@/lib/actions/profile";
import AvatarUpload from "./avatar-upload";
import { USER_ROLE_LABELS } from "@/types/database";

interface ProfileSettingsProps {
  profile: Profile;
}

export default function ProfileSettings({ profile }: ProfileSettingsProps) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone || "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      try {
        await updateProfile({
          full_name: fullName,
          phone: phone || undefined,
        });
        toast.success("Profil mis à jour avec succès");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour");
      }
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Photo de profil</h2>
        <AvatarUpload profile={profile} />
      </div>

      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Informations personnelles</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Jean Dupont"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+33 6 12 34 56 78"
            />
            <p className="text-sm text-muted-foreground">
              Format: +33 6 12 34 56 78 ou 06 12 34 56 78
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Pour changer votre email, contactez le support
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <Input
              id="role"
              type="text"
              value={USER_ROLE_LABELS[profile.role]}
              disabled
              className="bg-muted"
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
