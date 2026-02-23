import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditReservationLoading() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  );
}
