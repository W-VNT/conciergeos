import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationsList } from "@/components/notifications/notifications-list";
import type { Notification } from "@/types/database";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" showCreate={false} />
      <NotificationsList initialNotifications={(notifications as Notification[]) || []} />
    </div>
  );
}
