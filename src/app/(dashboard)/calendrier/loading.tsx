import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CalendrierLoading() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>

      {/* View tabs + navigation */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-10 w-64" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      {/* Calendar grid */}
      <Card className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        {/* Calendar cells */}
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="grid grid-cols-7 gap-1 mb-1">
            {Array.from({ length: 7 }).map((_, col) => (
              <Skeleton key={col} className="h-20 w-full" />
            ))}
          </div>
        ))}
      </Card>
    </div>
  );
}
