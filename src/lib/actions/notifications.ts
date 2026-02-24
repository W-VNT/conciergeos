"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { successResponse, errorResponse } from "@/lib/action-response";
import type { Notification } from "@/types/database";

export async function getUnreadNotifications() {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching unread notifications:", error);
    return [];
  }

  return data || [];
}

export async function getUnreadCount() {
  const profile = await requireProfile();
  const supabase = createClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .is("read_at", null);

  if (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }

  return count || 0;
}

export async function getAllNotifications(limit: number = 50) {
  const profile = await requireProfile();
  const supabase = createClient();
  const safeLim = Math.min(Math.max(1, limit), 200);

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(safeLim);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return data || [];
}

export async function markAsRead(notificationId: string) {
  z.string().uuid().parse(notificationId);
  const profile = await requireProfile();
  const supabase = createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", profile.id);

  if (error) {
    console.error("Error marking notification as read:", error);
    throw new Error("Impossible de marquer la notification comme lue");
  }

  revalidatePath("/notifications");
}

export async function markAllAsRead() {
  const profile = await requireProfile();
  const supabase = createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .is("read_at", null);

  if (error) {
    console.error("Error marking all notifications as read:", error);
    throw new Error("Impossible de marquer toutes les notifications comme lues");
  }

  revalidatePath("/notifications");
}

export async function deleteNotification(notificationId: string) {
  z.string().uuid().parse(notificationId);
  const profile = await requireProfile();
  const supabase = createClient();

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", profile.id);

  if (error) {
    console.error("Error deleting notification:", error);
    throw new Error("Impossible de supprimer la notification");
  }

  revalidatePath("/notifications");
}

// ---------------------------------------------------------------------------
// NO3 — Cursor-based pagination
// ---------------------------------------------------------------------------

export async function getNotificationsPaginated(
  cursor?: string,
  limit: number = 20
) {
  const profile = await requireProfile();
  const supabase = createClient();
  const safeLimit = Math.min(Math.max(1, limit), 100);

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
    .eq("organisation_id", profile.organisation_id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(safeLimit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching paginated notifications:", error);
    return { notifications: [] as Notification[], nextCursor: null };
  }

  const notifications = (data || []) as Notification[];
  const nextCursor =
    notifications.length === safeLimit
      ? notifications[notifications.length - 1].created_at
      : null;

  return { notifications, nextCursor };
}

// ---------------------------------------------------------------------------
// NO4 — Bulk actions
// ---------------------------------------------------------------------------

const bulkIdsSchema = z
  .array(z.string().uuid())
  .min(1, "Au moins un identifiant requis")
  .max(100, "Maximum 100 éléments à la fois");

export async function bulkMarkAsRead(ids: string[]) {
  const parsed = bulkIdsSchema.safeParse(ids);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const profile = await requireProfile();
  const supabase = createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .in("id", parsed.data)
    .eq("user_id", profile.id)
    .eq("organisation_id", profile.organisation_id);

  if (error) {
    console.error("Error bulk marking notifications as read:", error);
    return errorResponse("Impossible de marquer les notifications comme lues");
  }

  revalidatePath("/notifications");
  return successResponse("Notifications marquées comme lues");
}

export async function bulkDeleteNotifications(ids: string[]) {
  const parsed = bulkIdsSchema.safeParse(ids);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message);
  }

  const profile = await requireProfile();
  const supabase = createClient();

  const { error } = await supabase
    .from("notifications")
    .delete()
    .in("id", parsed.data)
    .eq("user_id", profile.id)
    .eq("organisation_id", profile.organisation_id);

  if (error) {
    console.error("Error bulk deleting notifications:", error);
    return errorResponse("Impossible de supprimer les notifications");
  }

  revalidatePath("/notifications");
  return successResponse("Notifications supprimées");
}
