"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export async function getTeamMembers() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

    // Get current user's profile to check role and org
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("organisation_id, role")
      .eq("id", user.id)
      .single();

    if (!currentProfile) {
      return { error: "Profil non trouvé" };
    }

    if (currentProfile.role !== "ADMIN") {
      return { error: "Accès refusé - Admin uniquement" };
    }

    // Get all members of the organisation
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, avatar_url, created_at")
      .eq("organisation_id", currentProfile.organisation_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get team members error:", error);
      return { error: "Erreur lors de la récupération des membres" };
    }

    // Get emails from auth.users for each profile
    const membersWithEmail = await Promise.all(
      profiles.map(async (profile) => {
        const { data: authData } = await supabase.auth.admin.getUserById(
          profile.id
        );
        return {
          ...profile,
          email: authData?.user?.email || null,
        };
      })
    );

    return { members: membersWithEmail };
  } catch (error) {
    console.error("Get team members error:", error);
    return { error: "Une erreur est survenue" };
  }
}

export async function getPendingInvitations() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

    // Get current user's profile
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("organisation_id, role")
      .eq("id", user.id)
      .single();

    if (!currentProfile || currentProfile.role !== "ADMIN") {
      return { error: "Accès refusé" };
    }

    // Get pending invitations
    const { data: invitations, error } = await supabase
      .from("invitations")
      .select("*")
      .eq("organisation_id", currentProfile.organisation_id)
      .eq("status", "PENDING")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get invitations error:", error);
      return { error: "Erreur lors de la récupération des invitations" };
    }

    return { invitations };
  } catch (error) {
    console.error("Get invitations error:", error);
    return { error: "Une erreur est survenue" };
  }
}

export async function inviteMember(data: { email: string; role: "ADMIN" | "OPERATEUR" }) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

    // Get current user's profile
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("organisation_id, role")
      .eq("id", user.id)
      .single();

    if (!currentProfile || currentProfile.role !== "ADMIN") {
      return { error: "Accès refusé - Admin uniquement" };
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { error: "Email invalide" };
    }

    // Check if email is already a member
    const { data: existingMembers } = await supabase
      .from("profiles")
      .select("id")
      .eq("organisation_id", currentProfile.organisation_id);

    if (existingMembers) {
      // Get emails for existing members
      for (const member of existingMembers) {
        const { data: authData } = await supabase.auth.admin.getUserById(
          member.id
        );
        if (authData?.user?.email === data.email) {
          return { error: "Cet email est déjà membre de l'organisation" };
        }
      }
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation } = await supabase
      .from("invitations")
      .select("id")
      .eq("organisation_id", currentProfile.organisation_id)
      .eq("email", data.email)
      .eq("status", "PENDING")
      .single();

    if (existingInvitation) {
      return { error: "Une invitation est déjà en attente pour cet email" };
    }

    // Create invitation
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const { error: insertError } = await supabase.from("invitations").insert({
      organisation_id: currentProfile.organisation_id,
      email: data.email,
      role: data.role,
      token,
      invited_by: user.id,
      expires_at: expiresAt.toISOString(),
      status: "PENDING",
    });

    if (insertError) {
      console.error("Insert invitation error:", insertError);
      return { error: "Erreur lors de la création de l'invitation" };
    }

    // TODO: Send invitation email with token
    // For now, just return success with the token for testing
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002"}/accept-invitation?token=${token}`;

    revalidatePath("/settings");

    return { success: true, invitationUrl };
  } catch (error) {
    console.error("Invite member error:", error);
    return { error: "Une erreur est survenue" };
  }
}

export async function cancelInvitation(invitationId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

    // Update invitation status
    const { error } = await supabase
      .from("invitations")
      .update({ status: "CANCELLED" })
      .eq("id", invitationId);

    if (error) {
      console.error("Cancel invitation error:", error);
      return { error: "Erreur lors de l'annulation de l'invitation" };
    }

    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    console.error("Cancel invitation error:", error);
    return { error: "Une erreur est survenue" };
  }
}

export async function removeMember(userId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Non authentifié" };
    }

    // Prevent self-removal
    if (user.id === userId) {
      return { error: "Vous ne pouvez pas vous retirer vous-même" };
    }

    // Get current user's profile
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("organisation_id, role")
      .eq("id", user.id)
      .single();

    if (!currentProfile || currentProfile.role !== "ADMIN") {
      return { error: "Accès refusé - Admin uniquement" };
    }

    // Check if we're not removing the last admin
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("organisation_id", currentProfile.organisation_id)
      .eq("role", "ADMIN");

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (
      targetProfile?.role === "ADMIN" &&
      admins &&
      admins.length <= 1
    ) {
      return {
        error: "Impossible de retirer le dernier administrateur",
      };
    }

    // Delete the profile (cascade will handle related data)
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId)
      .eq("organisation_id", currentProfile.organisation_id);

    if (error) {
      console.error("Remove member error:", error);
      return { error: "Erreur lors de la suppression du membre" };
    }

    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    console.error("Remove member error:", error);
    return { error: "Une erreur est survenue" };
  }
}
