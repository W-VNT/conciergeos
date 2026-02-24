"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { uploadAvatar, deleteAvatar } from "@/lib/actions/profile";
import { useRouter } from "next/navigation";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  fullName: string;
  size?: "sm" | "md" | "lg";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-red-500",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

const sizeClasses = {
  sm: "h-12 w-12 text-sm",
  md: "h-20 w-20 text-lg",
  lg: "h-28 w-28 text-2xl",
};

const iconSizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const badgeSizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-9 w-9",
};

export function AvatarUpload({
  currentAvatarUrl,
  fullName,
  size = "lg",
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate on client side
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Format non supporte. Utilisez JPG ou PNG.");
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error("Fichier trop volumineux. Taille maximale : 2 Mo.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const publicUrl = await uploadAvatar(formData);
      setAvatarUrl(publicUrl);
      toast.success("Avatar mis a jour");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'upload de l'avatar"
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAvatar();
      setAvatarUrl(null);
      toast.success("Avatar supprime");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la suppression de l'avatar"
      );
    } finally {
      setDeleting(false);
    }
  }

  const isLoading = uploading || deleting;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar with overlay */}
      <div className="relative group">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className={`relative ${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center cursor-pointer transition-opacity ${
            avatarUrl ? "bg-transparent" : `${getAvatarColor(fullName)} text-white`
          } ${isLoading ? "opacity-50" : "hover:opacity-90"}`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-semibold">{getInitials(fullName)}</span>
          )}

          {/* Upload overlay */}
          {!isLoading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-full">
              <Camera className={`${iconSizeClasses[size]} text-white`} />
            </div>
          )}

          {/* Loading spinner */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
              <Loader2 className={`${iconSizeClasses[size]} text-white animate-spin`} />
            </div>
          )}
        </button>

        {/* Camera badge */}
        {!isLoading && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`absolute bottom-0 right-0 ${badgeSizeClasses[size]} bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md border-2 border-background hover:bg-primary/90 transition-colors`}
          >
            <Camera className={iconSizeClasses[size]} />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        capture="user"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isLoading}
      />

      {/* Delete button (only shown when there's an avatar) */}
      {avatarUrl && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" />
          Supprimer l&apos;avatar
        </button>
      )}
    </div>
  );
}
