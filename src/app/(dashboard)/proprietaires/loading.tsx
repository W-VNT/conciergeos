import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProprietairesLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      {/* Filters skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Skeleton className="h-10 w-full sm:w-64" />
      </div>

      <TableSkeleton rows={10} columns={4} />
    </div>
  );
}
