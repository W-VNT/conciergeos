import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { DetailCardSkeleton } from "@/components/skeletons/detail-card-skeleton";

export default function ContratDetailLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton actionCount={3} />

      <div className="grid gap-6 md:grid-cols-2">
        <DetailCardSkeleton />
        <DetailCardSkeleton />
      </div>
    </div>
  );
}
