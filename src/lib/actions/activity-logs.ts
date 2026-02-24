"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { ActivityLog } from "@/types/database";

/**
 * Fetch activity logs for a given entity, ordered by created_at DESC.
 * Each log includes the actor's profile (full_name, avatar_url).
 */
export async function getActivityLogs(
  entityType: string,
  entityId: string
): Promise<ActivityLog[]> {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("activity_logs")
    .select("*, actor:profiles!actor_id(id, full_name, avatar_url)")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("organisation_id", profile.organisation_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getActivityLogs error:", error);
    return [];
  }

  return (data ?? []) as ActivityLog[];
}

/**
 * Insert a new activity log entry.
 * Automatically scoped to the current user's organisation.
 */
export async function logActivity(params: {
  entityType: string;
  entityId: string;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    const profile = await requireProfile();
    const supabase = createClient();

    const { error } = await supabase.from("activity_logs").insert({
      organisation_id: profile.organisation_id,
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: params.action,
      actor_id: profile.id,
      old_value: params.oldValue ?? null,
      new_value: params.newValue ?? null,
      metadata: params.metadata ?? null,
    });

    if (error) {
      console.error("logActivity error:", error);
    }
  } catch (err) {
    // Don't throw — logging should never break the main action
    console.error("logActivity unexpected error:", err);
  }
}
