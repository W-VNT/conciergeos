"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface UpdateProfileData {
  full_name?: string;
  phone?: string;
  avatar_url?: string | null;
}

/**
 * Update current user's profile
 */
export async function updateProfile(data: UpdateProfileData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Non authentifié");
  }

  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    throw new Error("Erreur lors de la mise à jour du profil");
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

/**
 * Upload avatar to storage and update profile
 */
export async function uploadAvatar(formData: FormData): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Non authentifié");
  }

  const file = formData.get("avatar") as File;
  if (!file) {
    throw new Error("Aucun fichier fourni");
  }

  // Validate file type
  const validTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (!validTypes.includes(file.type)) {
    throw new Error("Format de fichier non supporté. Utilisez JPG ou PNG.");
  }

  // Validate file size (max 2MB)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    throw new Error("Fichier trop volumineux. Taille maximale : 2MB.");
  }

  // Get file extension
  const ext = file.name.split(".").pop();
  const fileName = `avatar.${ext}`;
  const filePath = `${user.id}/${fileName}`;

  // Upload to storage (will overwrite if exists)
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("Error uploading avatar:", uploadError);
    throw new Error("Erreur lors de l'upload de l'avatar");
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  // Update profile with avatar URL
  await updateProfile({ avatar_url: publicUrl });

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return publicUrl;
}

/**
 * Delete avatar from storage and remove from profile
 */
export async function deleteAvatar() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Non authentifié");
  }

  // Get current profile to find avatar path
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.avatar_url) {
    // Extract file path from URL
    // URL format: https://...supabase.co/storage/v1/object/public/avatars/{user_id}/avatar.ext
    const urlParts = profile.avatar_url.split("/avatars/");
    if (urlParts[1]) {
      const filePath = urlParts[1];

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from("avatars")
        .remove([filePath]);

      if (deleteError) {
        console.error("Error deleting avatar:", deleteError);
        // Continue anyway to clear the URL from profile
      }
    }
  }

  // Remove avatar URL from profile
  await updateProfile({ avatar_url: null });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

/**
 * Get current user's profile
 */
export async function getCurrentProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Add email from auth.users
  if (profile) {
    return {
      ...profile,
      email: user.email,
    };
  }

  return null;
}
