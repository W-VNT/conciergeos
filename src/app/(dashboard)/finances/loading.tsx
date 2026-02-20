import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton";
import { KpiCardsSkeleton } from "@/components/skeletons/kpi-cards-skeleton";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";

export default function FinancesLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />

      <KpiCardsSkeleton count={3} />

      <TableSkeleton />
    </div>
  );
}
