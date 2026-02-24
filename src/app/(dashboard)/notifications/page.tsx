import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationsList } from "@/components/notifications/notifications-list";
import {
  getNotificationsPaginatedFiltered,
  type NotificationFilter,
} from "@/lib/actions/notifications";
import { getEmailDigest } from "@/lib/actions/profile-settings";
import { EmailDigestSetting } from "@/components/settings/email-digest-setting";
import { Separator } from "@/components/ui/separator";
import { NotificationTabs } from "@/components/notifications/notification-tabs";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

const VALID_TABS: NotificationFilter[] = [
  "all",
  "unread",
  "MISSION_ASSIGNED",
  "INCIDENT_CRITICAL",
  "SYSTEM",
];

interface NotificationsPageProps {
  searchParams: { tab?: string };
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const profile = await requireProfile();

  const rawTab = searchParams.tab ?? "all";
  const filter: NotificationFilter = VALID_TABS.includes(
    rawTab as NotificationFilter
  )
    ? (rawTab as NotificationFilter)
    : "all";

  const [{ notifications, nextCursor }, emailDigest] = await Promise.all([
    getNotificationsPaginatedFiltered(filter, undefined, 20),
    getEmailDigest(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" showCreate={false} />

      {/* Email digest setting */}
      <EmailDigestSetting initialValue={emailDigest} />

      <Separator />

      {/* Tab navigation */}
      <NotificationTabs activeTab={filter} />

      <NotificationsList
        initialNotifications={notifications}
        initialNextCursor={nextCursor}
        userId={profile.id}
        filter={filter}
      />
    </div>
  );
}
