import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface KpiCardsSkeletonProps {
  count?: number;
}

export function KpiCardsSkeleton({ count = 3 }: KpiCardsSkeletonProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
