"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface UpdateOrganisationData {
  name?: string;
  city?: string;
  logo_url?: string | null;
}

/**
 * Update organisation details
 */
export async function updateOrganisation(data: UpdateOrganisationData) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

    // Get user's profile to check role and organisation
    const { data: profile } = await supabase
      .from("profiles")
      .select("organisation_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return { error: "Profil non trouvé" };
    }

    if (profile.role !== "ADMIN") {
      return { error: "Accès refusé - Admin uniquement" };
    }

    const { error } = await supabase
      .from("organisations")
      .update(data)
      .eq("id", profile.organisation_id);

    if (error) {
      console.error("Update organisation error:", error);
      return { error: "Erreur lors de la mise à jour de l'organisation" };
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Update organisation error:", error);
    return { error: "Une erreur est survenue" };
  }
}

/**
 * Upload organisation logo
 */
export async function uploadOrganisationLogo(formData: FormData): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Non authentifié");
  }

  // Get user's organisation
  const { data: profile } = await supabase
    .from("profiles")
    .select("organisation_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "ADMIN") {
    throw new Error("Accès refusé - Admin uniquement");
  }

  const file = formData.get("logo") as File;
  if (!file) {
    throw new Error("Aucun fichier fourni");
  }

  // Validate file type
  const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/svg+xml"];
  if (!validTypes.includes(file.type)) {
    throw new Error("Format non supporté. Utilisez JPG, PNG ou SVG.");
  }

  // Validate file size (max 5MB for logo)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("Fichier trop volumineux. Taille maximale : 5MB.");
  }

  // Get file extension
  const ext = file.name.split(".").pop();
  const fileName = `logo.${ext}`;
  const filePath = `${profile.organisation_id}/${fileName}`;

  // Upload to organisations bucket (will overwrite if exists)
  const { error: uploadError } = await supabase.storage
    .from("organisations")
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("Error uploading logo:", uploadError);
    throw new Error("Erreur lors de l'upload du logo");
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("organisations").getPublicUrl(filePath);

  // Update organisation with logo URL
  await updateOrganisation({ logo_url: publicUrl });

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return publicUrl;
}

/**
 * Delete organisation logo
 */
export async function deleteOrganisationLogo() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Non authentifié");
  }

  // Get user's organisation
  const { data: profile } = await supabase
    .from("profiles")
    .select("organisation_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "ADMIN") {
    throw new Error("Accès refusé - Admin uniquement");
  }

  // Get current organisation to find logo path
  const { data: organisation } = await supabase
    .from("organisations")
    .select("logo_url")
    .eq("id", profile.organisation_id)
    .single();

  if (organisation?.logo_url) {
    // Extract file path from URL
    const urlParts = organisation.logo_url.split("/organisations/");
    if (urlParts[1]) {
      const filePath = urlParts[1];

      // Delete from storage
      await supabase.storage.from("organisations").remove([filePath]);
    }
  }

  // Remove logo URL from organisation
  await updateOrganisation({ logo_url: null });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

/**
 * Get current organisation
 */
export async function getCurrentOrganisation() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organisation_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  const { data: organisation } = await supabase
    .from("organisations")
    .select("*")
    .eq("id", profile.organisation_id)
    .single();

  return organisation;
}

/**
 * Delete organisation (DANGER ZONE)
 * This will CASCADE delete all related data:
 * - proprietaires, logements, missions, reservations, contrats, revenus, etc.
 * - profiles (users will lose access)
 */
export async function deleteOrganisation(confirmationName: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Non authentifié");
  }

  // Get user's profile to check role and organisation
  const { data: profile } = await supabase
    .from("profiles")
    .select("organisation_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    throw new Error("Profil non trouvé");
  }

  if (profile.role !== "ADMIN") {
    throw new Error("Accès refusé - Admin uniquement");
  }

  // Get organisation to verify name
  const { data: organisation } = await supabase
    .from("organisations")
    .select("name")
    .eq("id", profile.organisation_id)
    .single();

  if (!organisation) {
    throw new Error("Organisation non trouvée");
  }

  // Verify confirmation name matches
  if (organisation.name !== confirmationName) {
    throw new Error("Le nom de l'organisation ne correspond pas");
  }

  // Delete organisation (CASCADE will handle all related data)
  const { error } = await supabase
    .from("organisations")
    .delete()
    .eq("id", profile.organisation_id);

  if (error) {
    console.error("Delete organisation error:", error);
    throw new Error("Erreur lors de la suppression de l'organisation");
  }

  // Sign out the user (they no longer have access)
  await supabase.auth.signOut();

  revalidatePath("/");

  return { success: true };
}
