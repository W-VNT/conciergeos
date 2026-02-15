"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: {
  full_name: string;
  phone: string | null;
}) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

    // Validate phone format if provided
    if (data.phone) {
      const phoneRegex = /^(?:\+33|0)[1-9](?:[0-9]{8})$/;
      const cleanPhone = data.phone.replace(/\s/g, "");
      if (!phoneRegex.test(cleanPhone)) {
        return {
          error:
            "Format de téléphone invalide. Utilisez +33612345678 ou 0612345678",
        };
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        phone: data.phone,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Profile update error:", error);
      return { error: "Erreur lors de la mise à jour du profil" };
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    return { error: "Une erreur est survenue" };
  }
}

export async function updateAvatarUrl(avatarUrl: string | null) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        avatar_url: avatarUrl,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Avatar update error:", error);
      return { error: "Erreur lors de la mise à jour de l'avatar" };
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Update avatar error:", error);
    return { error: "Une erreur est survenue" };
  }
}
