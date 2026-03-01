"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function updatePassword(
  currentPassword: string,
  newPassword: string
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return { error: "Non authentifié" };
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return {
        error: "Le mot de passe doit contenir au moins 8 caractères",
      };
    }

    // Check new password is different from current
    if (currentPassword === newPassword) {
      return {
        error: "Le nouveau mot de passe doit être différent de l'ancien",
      };
    }

    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return { error: "Mot de passe actuel incorrect" };
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("Password update error:", error);
      return { error: "Erreur lors de la mise à jour du mot de passe" };
    }

    // Send notification email (best-effort, don't block on failure)
    try {
      const { sendEmail } = await import("@/lib/email/sender");
      const { passwordChangedEmail } = await import("@/lib/email/templates");
      await sendEmail({
        to: user.email,
        template: passwordChangedEmail({
          userName: user.email.split("@")[0],
        }),
      });
    } catch {
      // Non-blocking: don't fail password update if email fails
    }

    return { success: true };
  } catch (error) {
    console.error("Update password error:", error);
    return { error: "Une erreur est survenue" };
  }
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc('check_email_exists', {
    email_input: email.trim().toLowerCase(),
  });
  if (error) return false;
  return !!data;
}

export async function deleteAccount(confirmationEmail: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Non authentifié");
  }

  // Get profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organisation_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    throw new Error("Profil non trouvé");
  }

  // Block ADMIN from deleting their account (must transfer role or delete org first)
  if (profile.role === "ADMIN") {
    throw new Error(
      "Vous devez d'abord transférer le rôle admin ou supprimer l'organisation avant de supprimer votre compte"
    );
  }

  // Verify email confirmation (case-insensitive)
  if (user.email?.toLowerCase() !== confirmationEmail.toLowerCase()) {
    throw new Error("L'email ne correspond pas");
  }

  // Delete profile (orphan auth.user will have no access via requireProfile)
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (error) {
    console.error("Delete account error:", error);
    throw new Error("Erreur lors de la suppression du compte");
  }

  // Sign out all sessions (revoke all tokens)
  await supabase.auth.signOut({ scope: "global" });

  redirect("/login");
}
