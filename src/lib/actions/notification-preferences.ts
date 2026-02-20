"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { type ActionResponse, successResponse, errorResponse } from "@/lib/action-response";

export interface NotificationPreferences {
  // Mission notifications
  notify_mission_assigned: boolean;
  notify_mission_reminder: boolean;
  notify_mission_late: boolean;

  // Incident notifications
  notify_incident_opened: boolean;
  notify_incident_assigned: boolean;
  notify_incident_resolved: boolean;

  // Reservation notifications
  notify_reservation_confirmed: boolean;
  notify_reservation_checkin_soon: boolean;
  notify_reservation_checkout_today: boolean;

  // Alert notifications
  notify_urgent_missions: boolean;
  notify_critical_incidents: boolean;

  // Digest preferences
  daily_digest: boolean;
  weekly_digest: boolean;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", profile.id)
      .single();

    if (error) {
      // If no preferences exist, return defaults
      if (error.code === "PGRST116") {
        return {
          notify_mission_assigned: true,
          notify_mission_reminder: true,
          notify_mission_late: true,
          notify_incident_opened: true,
          notify_incident_assigned: true,
          notify_incident_resolved: true,
          notify_reservation_confirmed: true,
          notify_reservation_checkin_soon: true,
          notify_reservation_checkout_today: true,
          notify_urgent_missions: true,
          notify_critical_incidents: true,
          daily_digest: false,
          weekly_digest: false,
        };
      }
      console.error("Error fetching notification preferences:", error);
      return null;
    }

    return data as NotificationPreferences;
  } catch (err) {
    console.error("Error:", err);
    return null;
  }
}

export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<ActionResponse> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    // Try to update first
    const { error: updateError } = await supabase
      .from("notification_preferences")
      .update(preferences)
      .eq("user_id", profile.id);

    // If update failed because row doesn't exist, insert it
    if (updateError && updateError.code === "PGRST116") {
      const { error: insertError } = await supabase
        .from("notification_preferences")
        .insert({
          user_id: profile.id,
          ...preferences,
        });

      if (insertError) {
        console.error("Error inserting notification preferences:", insertError);
        return errorResponse("Erreur lors de la sauvegarde des préférences");
      }
    } else if (updateError) {
      console.error("Error updating notification preferences:", updateError);
      return errorResponse("Erreur lors de la mise à jour des préférences");
    }

    revalidatePath("/settings");

    return successResponse("Préférences de notifications mises à jour");
  } catch (err) {
    console.error("Error:", err);
    return errorResponse((err as Error).message ?? "Erreur lors de la sauvegarde");
  }
}
