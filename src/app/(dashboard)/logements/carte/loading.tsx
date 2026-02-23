import { Skeleton } from "@/components/ui/skeleton";

export default function CarteLoading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="w-full h-[500px] rounded-lg" />
    </div>
  );
}
