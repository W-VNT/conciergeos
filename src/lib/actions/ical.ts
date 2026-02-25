"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/action-response";
import crypto from "crypto";

/**
 * Generate a signed token for the iCal URL.
 *
 * The token is an HMAC-SHA256 of the organisationId using a secret key,
 * making it deterministic so the same org always gets the same token
 * (no need to store it in the DB).
 */
export async function generateIcalToken(organisationId: string) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) {
    return errorResponse("Seuls les administrateurs peuvent generer un lien iCal");
  }

  if (profile.organisation_id !== organisationId) {
    return errorResponse("Organisation non autorisee");
  }

  const secret = process.env.ICAL_SECRET || process.env.CRON_SECRET;
  if (!secret) throw new Error("ICAL_SECRET ou CRON_SECRET non configuré");
  const token = crypto
    .createHmac("sha256", secret)
    .update(organisationId)
    .digest("hex");

  return successResponse("Token genere", { token });
}

/**
 * Returns the full iCal URL for an organisation.
 */
export async function getIcalUrl(organisationId: string) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) {
    return errorResponse("Seuls les administrateurs peuvent obtenir le lien iCal");
  }

  if (profile.organisation_id !== organisationId) {
    return errorResponse("Organisation non autorisee");
  }

  const secret = process.env.ICAL_SECRET || process.env.CRON_SECRET;
  if (!secret) throw new Error("ICAL_SECRET ou CRON_SECRET non configuré");
  const token = crypto
    .createHmac("sha256", secret)
    .update(organisationId)
    .digest("hex");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${baseUrl}/api/ical/${organisationId}?token=${token}`;

  return successResponse("URL generee", { url, token });
}

/**
 * Verify an iCal token for a given organisation ID.
 * Used by the public iCal endpoint.
 */
export async function verifyIcalToken(
  organisationId: string,
  token: string
): Promise<boolean> {
  const secret = process.env.ICAL_SECRET || process.env.CRON_SECRET;
  if (!secret) throw new Error("ICAL_SECRET ou CRON_SECRET non configuré");
  const expectedToken = crypto
    .createHmac("sha256", secret)
    .update(organisationId)
    .digest("hex");

  // Ensure both buffers have the same length to avoid timingSafeEqual crash
  const tokenBuf = Buffer.from(token, "utf8");
  const expectedBuf = Buffer.from(expectedToken, "utf8");
  if (tokenBuf.length !== expectedBuf.length) return false;

  return crypto.timingSafeEqual(tokenBuf, expectedBuf);
}
