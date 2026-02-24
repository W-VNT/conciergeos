"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { successResponse, errorResponse } from "@/lib/action-response";

/**
 * Generate a random base32-encoded secret for TOTP.
 */
function generateSecret(): string {
  const bytes = crypto.randomBytes(20);
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < bytes.length; i++) {
    secret += base32Chars[bytes[i] % 32];
  }
  return secret;
}

/**
 * Generate a set of backup codes.
 */
function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    // Format as XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

/**
 * Simplified TOTP: generate a 6-digit code from HMAC-SHA1 of
 * (secret + Math.floor(Date.now() / 30000)).
 */
function generateTOTPCode(secret: string, timeStep?: number): string {
  const step = timeStep ?? Math.floor(Date.now() / 30000);
  const hmac = crypto.createHmac("sha1", secret);
  hmac.update(String(step));
  const hash = hmac.digest("hex");
  // Take last 4 hex chars, convert to number, mod 1000000
  const offset = parseInt(hash.slice(-1), 16);
  const truncated = parseInt(hash.slice(offset * 2, offset * 2 + 8), 16);
  const code = (truncated & 0x7fffffff) % 1000000;
  return String(code).padStart(6, "0");
}

/**
 * Verify a TOTP token against the secret.
 * Allows a window of +/- 1 time step for clock drift.
 */
function verifyTOTPCode(secret: string, token: string): boolean {
  const currentStep = Math.floor(Date.now() / 30000);
  for (let offset = -1; offset <= 1; offset++) {
    const expected = generateTOTPCode(secret, currentStep + offset);
    if (expected === token) return true;
  }
  return false;
}

/**
 * Format a secret for display (groups of 4 characters).
 */
function formatSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(" ") ?? secret;
}

/**
 * Setup 2FA: generates TOTP secret, stores in profile, returns secret + backup codes.
 */
export async function setup2FA() {
  const profile = await requireProfile();
  const supabase = createClient();

  // Check if 2FA is already enabled
  const { data: current } = await supabase
    .from("profiles")
    .select("totp_enabled, totp_secret")
    .eq("id", profile.id)
    .single();

  if (current?.totp_enabled) {
    return errorResponse("La 2FA est deja activee");
  }

  const secret = generateSecret();
  const backupCodes = generateBackupCodes();

  // Store secret and backup codes (not yet enabled)
  const { error } = await supabase
    .from("profiles")
    .update({
      totp_secret: secret,
      backup_codes: backupCodes,
      totp_enabled: false,
    })
    .eq("id", profile.id);

  if (error) {
    console.error("Error setting up 2FA:", error);
    return errorResponse("Erreur lors de la configuration 2FA");
  }

  return successResponse("Secret genere", {
    secret,
    formattedSecret: formatSecret(secret),
    backupCodes,
  });
}

/**
 * Enable 2FA: verifies the TOTP token, then enables 2FA.
 */
export async function enable2FA(token: string) {
  const profile = await requireProfile();
  const supabase = createClient();

  // Get current secret
  const { data: current } = await supabase
    .from("profiles")
    .select("totp_secret, totp_enabled, backup_codes")
    .eq("id", profile.id)
    .single();

  if (!current?.totp_secret) {
    return errorResponse("Aucun secret 2FA configure. Veuillez recommencer la configuration.");
  }

  if (current.totp_enabled) {
    return errorResponse("La 2FA est deja activee");
  }

  // Verify the token
  const isValid = verifyTOTPCode(current.totp_secret, token.trim());
  if (!isValid) {
    return errorResponse("Code invalide. Verifiez votre application d'authentification.");
  }

  // Enable 2FA
  const { error } = await supabase
    .from("profiles")
    .update({ totp_enabled: true })
    .eq("id", profile.id);

  if (error) {
    console.error("Error enabling 2FA:", error);
    return errorResponse("Erreur lors de l'activation 2FA");
  }

  revalidatePath("/account");
  return successResponse("2FA activee avec succes", {
    backupCodes: current.backup_codes as string[],
  });
}

/**
 * Disable 2FA: clears secret and disables 2FA.
 */
export async function disable2FA() {
  const profile = await requireProfile();
  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      totp_enabled: false,
      totp_secret: null,
      backup_codes: null,
    })
    .eq("id", profile.id);

  if (error) {
    console.error("Error disabling 2FA:", error);
    return errorResponse("Erreur lors de la desactivation 2FA");
  }

  revalidatePath("/account");
  return successResponse("2FA desactivee");
}

/**
 * Get backup codes if 2FA is enabled.
 */
export async function getBackupCodes() {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("totp_enabled, backup_codes")
    .eq("id", profile.id)
    .single();

  if (error || !data) {
    return errorResponse("Erreur lors de la recuperation des codes");
  }

  if (!data.totp_enabled) {
    return errorResponse("La 2FA n'est pas activee");
  }

  return successResponse("Codes de secours", {
    backupCodes: (data.backup_codes as string[]) ?? [],
  });
}

/**
 * Regenerate backup codes.
 */
export async function regenerateBackupCodes() {
  const profile = await requireProfile();
  const supabase = createClient();

  // Verify 2FA is enabled
  const { data: current } = await supabase
    .from("profiles")
    .select("totp_enabled")
    .eq("id", profile.id)
    .single();

  if (!current?.totp_enabled) {
    return errorResponse("La 2FA n'est pas activee");
  }

  const newCodes = generateBackupCodes();

  const { error } = await supabase
    .from("profiles")
    .update({ backup_codes: newCodes })
    .eq("id", profile.id);

  if (error) {
    console.error("Error regenerating backup codes:", error);
    return errorResponse("Erreur lors de la regeneration des codes");
  }

  return successResponse("Codes de secours regeneres", {
    backupCodes: newCodes,
  });
}

/**
 * Get 2FA status for the current user.
 */
export async function get2FAStatus() {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("totp_enabled")
    .eq("id", profile.id)
    .single();

  if (error || !data) {
    return { enabled: false };
  }

  return { enabled: !!data.totp_enabled };
}
