import { Skeleton } from "@/components/ui/skeleton";

interface PageHeaderSkeletonProps {
  showButtons?: number;
}

export function PageHeaderSkeleton({ showButtons = 0 }: PageHeaderSkeletonProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        {showButtons > 0 && (
          <div className="flex items-center gap-2">
            {Array.from({ length: showButtons }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
