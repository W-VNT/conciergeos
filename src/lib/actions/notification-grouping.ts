"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { NotificationType, EntityType } from "@/types/database";

interface GroupedNotificationParams {
  /** Target user ID to receive the notification */
  userId: string;
  /** Organisation ID for scoping */
  organisationId: string;
  /** Notification type */
  type: NotificationType;
  /** Base title (e.g. "Missions assignees") */
  title: string;
  /** Singular message template (e.g. "mission vous a ete assignee") */
  singularMessage: string;
  /** Plural message template (e.g. "missions vous ont ete assignees") */
  pluralMessage: string;
  /** Entity type for deep links */
  entityType?: EntityType;
  /** Entity ID for deep links (the latest entity) */
  entityId?: string;
  /** Actor ID — part of the group key */
  actorId: string;
  /** Optional metadata */
  metadata?: Record<string, string>;
}

/**
 * Creates a grouped notification.
 *
 * group_key format: `{type}:{date}:{actorId}`
 *
 * If a notification with the same group_key already exists and was created
 * within the last hour, we update it with an incremented count instead of
 * creating a new notification.
 */
export async function createGroupedNotification(
  params: GroupedNotificationParams
) {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const groupKey = `${params.type}:${today}:${params.actorId}`;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Look for an existing notification with the same group_key created within the last hour
  const { data: existing } = await supabase
    .from("notifications")
    .select("id, message, metadata")
    .eq("user_id", params.userId)
    .eq("organisation_id", params.organisationId)
    .eq("group_key", groupKey)
    .gte("created_at", oneHourAgo)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    // Parse existing count from the message
    const countMatch = existing.message.match(/^(\d+)\s/);
    const currentCount = countMatch ? parseInt(countMatch[1], 10) : 1;
    const newCount = currentCount + 1;

    const newMessage = `${newCount} ${params.pluralMessage}`;

    // Merge metadata
    const mergedMetadata = {
      ...(existing.metadata ?? {}),
      ...(params.metadata ?? {}),
      group_count: String(newCount),
    };

    const { error } = await supabase
      .from("notifications")
      .update({
        message: newMessage,
        title: params.title,
        entity_type: params.entityType ?? null,
        entity_id: params.entityId ?? null,
        metadata: mergedMetadata,
        read_at: null, // Re-mark as unread since it's been updated
        created_at: new Date().toISOString(), // Bump to the top
      })
      .eq("id", existing.id);

    if (error) {
      console.error("Error updating grouped notification:", error);
      throw new Error("Impossible de mettre a jour la notification groupee");
    }

    revalidatePath("/notifications");
    return { id: existing.id, grouped: true, count: newCount };
  }

  // No existing group — create a new notification
  const message = `1 ${params.singularMessage}`;

  const { data: inserted, error } = await supabase
    .from("notifications")
    .insert({
      user_id: params.userId,
      organisation_id: params.organisationId,
      type: params.type,
      title: params.title,
      message,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      group_key: groupKey,
      metadata: {
        ...(params.metadata ?? {}),
        group_count: "1",
      },
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating grouped notification:", error);
    throw new Error("Impossible de creer la notification groupee");
  }

  revalidatePath("/notifications");
  return { id: inserted.id, grouped: false, count: 1 };
}

/**
 * Convenience function: create grouped notifications for bulk mission assignment.
 * Call this once per target user when assigning multiple missions at once.
 */
export async function createBulkMissionAssignmentNotification(params: {
  userId: string;
  organisationId: string;
  actorId: string;
  missionCount: number;
  /** The last mission ID (for deep link) */
  latestMissionId: string;
  missionType?: string;
}) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const groupKey = `MISSION_ASSIGNED:${today}:${params.actorId}`;
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Check existing grouped notification
  const { data: existing } = await supabase
    .from("notifications")
    .select("id, message, metadata")
    .eq("user_id", params.userId)
    .eq("organisation_id", params.organisationId)
    .eq("group_key", groupKey)
    .gte("created_at", oneHourAgo)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const countMatch = existing.message.match(/^(\d+)\s/);
    const currentCount = countMatch ? parseInt(countMatch[1], 10) : 1;
    const newCount = currentCount + params.missionCount;

    const newMessage =
      newCount === 1
        ? "1 mission vous a ete assignee"
        : `${newCount} missions vous ont ete assignees`;

    const { error } = await supabase
      .from("notifications")
      .update({
        message: newMessage,
        title: "Missions assignees",
        entity_type: "MISSION",
        entity_id: params.latestMissionId,
        metadata: {
          ...(existing.metadata ?? {}),
          group_count: String(newCount),
          mission_type: params.missionType,
        },
        read_at: null,
        created_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      console.error("Error updating bulk mission notification:", error);
    }

    revalidatePath("/notifications");
    return { grouped: true, count: newCount };
  }

  // Create new grouped notification
  const message =
    params.missionCount === 1
      ? "1 mission vous a ete assignee"
      : `${params.missionCount} missions vous ont ete assignees`;

  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    organisation_id: params.organisationId,
    type: "MISSION_ASSIGNED" as const,
    title: "Missions assignees",
    message,
    entity_type: "MISSION",
    entity_id: params.latestMissionId,
    group_key: groupKey,
    metadata: {
      group_count: String(params.missionCount),
      mission_type: params.missionType,
    },
  });

  if (error) {
    console.error("Error creating bulk mission notification:", error);
  }

  revalidatePath("/notifications");
  return { grouped: false, count: params.missionCount };
}
