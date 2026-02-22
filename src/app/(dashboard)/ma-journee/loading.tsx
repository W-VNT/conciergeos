import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function MaJourneeLoading() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-48 mt-1" />
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Timeline cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center pt-3 w-12 flex-shrink-0">
              <Skeleton className="h-4 w-10" />
              <div className="flex-1 w-px bg-border mt-2" />
            </div>
            <div className="flex-1 min-w-0">
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-36" />
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
