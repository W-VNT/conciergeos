"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { successResponse, errorResponse } from "@/lib/action-response";
import type { EmailDigest } from "@/types/database";

const emailDigestSchema = z.enum(["NONE", "QUOTIDIEN", "HEBDOMADAIRE"]);

/**
 * Update the current user's email_digest preference.
 */
export async function updateEmailDigest(frequency: EmailDigest) {
  const parsed = emailDigestSchema.safeParse(frequency);
  if (!parsed.success) {
    return errorResponse("Frequence invalide");
  }

  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ email_digest: parsed.data })
    .eq("id", profile.id);

  if (error) {
    console.error("Error updating email digest:", error);
    return errorResponse("Impossible de mettre a jour la preference");
  }

  revalidatePath("/notifications");
  revalidatePath("/account");
  return successResponse("Preference de digest mise a jour");
}

/**
 * Get the current user's email_digest preference.
 */
export async function getEmailDigest(): Promise<EmailDigest> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("email_digest")
    .eq("id", profile.id)
    .single();

  if (error || !data) {
    return "NONE";
  }

  return (data.email_digest as EmailDigest) ?? "NONE";
}
