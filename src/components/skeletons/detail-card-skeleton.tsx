import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DetailCardSkeletonProps {
  title?: string;
  rows?: number;
}

export function DetailCardSkeleton({ title, rows = 4 }: DetailCardSkeletonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || <Skeleton className="h-6 w-32" />}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
