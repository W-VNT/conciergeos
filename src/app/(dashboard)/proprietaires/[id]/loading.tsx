import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { DetailCardSkeleton } from "@/components/skeletons/detail-card-skeleton";

export default function ProprietaireDetailLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton actionCount={2} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DetailCardSkeleton />
        <DetailCardSkeleton />
        <DetailCardSkeleton />
      </div>
    </div>
  );
}
