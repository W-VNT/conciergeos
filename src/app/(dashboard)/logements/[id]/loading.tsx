import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { DetailCardSkeleton } from "@/components/skeletons/detail-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function LogementDetailLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton showButtons={3} />

      <div className="grid gap-6 md:grid-cols-2">
        <DetailCardSkeleton />
        <DetailCardSkeleton />
        <DetailCardSkeleton />
      </div>

      {/* Photo section skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <div className="flex gap-4 border-b">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
