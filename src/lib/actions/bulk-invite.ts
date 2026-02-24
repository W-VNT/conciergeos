"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { randomUUID } from "crypto";
import { sendInvitationEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";

interface BulkInviteResult {
  total: number;
  success: number;
  errors: Array<{ email: string; error: string }>;
}

/**
 * Invite multiple proprietaires at once.
 * For each email: validates, checks duplicates, creates invitation, sends email.
 */
export async function bulkInviteProprietaires(
  emails: string[]
): Promise<ActionResponse<BulkInviteResult>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errorResponse("Non authentifié") as ActionResponse<BulkInviteResult>;

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("organisation_id, role, full_name, organisation:organisations(name)")
      .eq("id", user.id)
      .single();

    if (!currentProfile || currentProfile.role !== "ADMIN") {
      return errorResponse("Accès refusé - Admin uniquement") as ActionResponse<BulkInviteResult>;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const results: BulkInviteResult = { total: emails.length, success: 0, errors: [] };

    // Deduplicate emails
    const uniqueEmails = Array.from(new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean)));
    results.total = uniqueEmails.length;

    for (const rawEmail of uniqueEmails) {
      const email = rawEmail.trim().toLowerCase();

      // Validate email format
      if (!emailRegex.test(email)) {
        results.errors.push({ email, error: "Format d'email invalide" });
        continue;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from("profiles")
        .select("id")
        .eq("organisation_id", currentProfile.organisation_id)
        .ilike("email", email)
        .maybeSingle();

      if (existingMember) {
        results.errors.push({ email, error: "Déjà membre de l'organisation" });
        continue;
      }

      // Check if there's already a pending invitation
      const { data: existingInvitation } = await supabase
        .from("invitations")
        .select("id")
        .eq("organisation_id", currentProfile.organisation_id)
        .ilike("email", email)
        .eq("status", "PENDING")
        .maybeSingle();

      if (existingInvitation) {
        results.errors.push({ email, error: "Invitation déjà en attente" });
        continue;
      }

      // Create invitation
      const token = randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error: insertError } = await supabase.from("invitations").insert({
        organisation_id: currentProfile.organisation_id,
        email,
        invited_name: null,
        role: "PROPRIETAIRE",
        token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
        status: "PENDING",
      });

      if (insertError) {
        results.errors.push({ email, error: "Erreur lors de la création de l'invitation" });
        continue;
      }

      // Send invitation email
      const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/accept-invitation?token=${token}`;

      try {
        await sendInvitationEmail({
          email,
          inviteeName: null,
          organisationName: (currentProfile.organisation as { name?: string } | null)?.name || "l'organisation",
          inviterName: currentProfile.full_name || "Un administrateur",
          invitationUrl,
          role: "PROPRIETAIRE",
        });
      } catch {
        // Don't fail the invitation if email fails
        console.error(`Failed to send invitation email to ${email}`);
      }

      results.success++;
    }

    revalidatePath("/proprietaires");
    revalidatePath("/organisation");

    if (results.success === 0 && results.errors.length > 0) {
      return errorResponse(
        `Aucune invitation envoyée. ${results.errors.length} erreur(s).`
      ) as ActionResponse<BulkInviteResult>;
    }

    return successResponse(
      `${results.success} invitation${results.success > 1 ? "s" : ""} envoyée${results.success > 1 ? "s" : ""} avec succès${results.errors.length > 0 ? ` (${results.errors.length} erreur${results.errors.length > 1 ? "s" : ""})` : ""}`,
      results
    );
  } catch (err) {
    console.error("bulkInviteProprietaires error:", err);
    return errorResponse(
      (err as Error).message ?? "Erreur lors de l'envoi des invitations"
    ) as ActionResponse<BulkInviteResult>;
  }
}
