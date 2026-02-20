import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function CalendrierLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      {/* Calendar skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    </div>
  );
}
