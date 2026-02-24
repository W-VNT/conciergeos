import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { getNotificationsPaginated } from "@/lib/actions/notifications";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const profile = await requireProfile();
  const { notifications, nextCursor } = await getNotificationsPaginated(
    undefined,
    20
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" showCreate={false} />
      <NotificationsList
        initialNotifications={notifications}
        initialNextCursor={nextCursor}
        userId={profile.id}
      />
    </div>
  );
}
