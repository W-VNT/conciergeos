"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return data || [];
}

export async function markAsRead(notificationId: string) {
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
