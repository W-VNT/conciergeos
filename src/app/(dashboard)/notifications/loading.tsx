import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";

export default function NotificationsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      <TableSkeleton rows={10} columns={3} />
    </div>
  );
}
