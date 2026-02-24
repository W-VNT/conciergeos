import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { getNotificationsPaginated } from "@/lib/actions/notifications";
import { getEmailDigest } from "@/lib/actions/profile-settings";
import { EmailDigestSetting } from "@/components/settings/email-digest-setting";
import { Separator } from "@/components/ui/separator";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const profile = await requireProfile();
  const [{ notifications, nextCursor }, emailDigest] = await Promise.all([
    getNotificationsPaginated(undefined, 20),
    getEmailDigest(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" showCreate={false} />

      {/* Email digest setting */}
      <EmailDigestSetting initialValue={emailDigest} />

      <Separator />

      <NotificationsList
        initialNotifications={notifications}
        initialNextCursor={nextCursor}
        userId={profile.id}
      />
    </div>
  );
}
