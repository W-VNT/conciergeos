"use server";

import { createClient } from "@/lib/supabase/server";

export async function updatePassword(newPassword: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return {
        error: "Le mot de passe doit contenir au moins 8 caractères",
      };
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("Password update error:", error);
      return { error: "Erreur lors de la mise à jour du mot de passe" };
    }

    return { success: true };
  } catch (error) {
    console.error("Update password error:", error);
    return { error: "Une erreur est survenue" };
  }
}
