"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Profile } from "@/types/database";
import { updateAvatarUrl } from "@/lib/actions/profile";

interface AvatarUploadProps {
  profile: Profile;
}

export default function AvatarUpload({ profile }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const supabase = createClient();

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith("image/")) {
      toast.error("Le fichier doit être une image (JPG, PNG)");
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error("L'image ne doit pas dépasser 2 MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/avatar.${ext}`;

      // Upload to avatars bucket
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, {
          upsert: true, // Replace existing avatar
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      // Update profile with new avatar URL
      const result = await updateAvatarUrl(publicUrl);

      if (result.error) {
        throw new Error(result.error);
      }

      setAvatarUrl(publicUrl);
      toast.success("Photo de profil mise à jour");
    } catch (err) {
      toast.error("Erreur lors de l'upload");
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete() {
    try {
      setUploading(true);

      // Delete from storage
      if (avatarUrl) {
        const pathMatch = avatarUrl.match(/\/avatars\/(.+)$/);
        if (pathMatch) {
          await supabase.storage.from("avatars").remove([pathMatch[1]]);
        }
      }

      // Update profile to remove avatar URL
      const result = await updateAvatarUrl(null);

      if (result.error) {
        throw new Error(result.error);
      }

      setAvatarUrl(null);
      toast.success("Photo de profil supprimée");
    } catch (err) {
      toast.error("Erreur lors de la suppression");
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-6">
      {/* Avatar preview */}
      <div className="relative">
        <div className="h-24 w-24 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-border">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={profile.full_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl font-semibold text-primary">
              {getInitials(profile.full_name)}
            </span>
          )}
        </div>
        {avatarUrl && !uploading && (
          <button
            onClick={handleDelete}
            className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-md"
            title="Supprimer la photo"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Upload button */}
      <div className="flex flex-col gap-2">
        <label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            className="hidden"
            onChange={handleUpload}
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
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              {avatarUrl ? "Changer la photo" : "Ajouter une photo"}
            </span>
          </Button>
        </label>
        <p className="text-xs text-muted-foreground">
          JPG, PNG. Max 2 MB
        </p>
      </div>
    </div>
  );
}
