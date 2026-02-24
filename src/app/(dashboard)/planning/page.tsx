import { getPlanningData } from "@/lib/actions/planning";
import { PageHeader } from "@/components/shared/page-header";
import { PlanningView } from "@/components/missions/planning-view";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { startOfWeek, addWeeks, subWeeks, format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

interface Props {
  searchParams: { week?: string };
}

export default async function PlanningPage({ searchParams }: Props) {
  // Determine week start (Monday)
  const weekParam = searchParams.week;
  const currentWeekStart = weekParam
    ? startOfWeek(new Date(weekParam), { weekStartsOn: 1 })
    : startOfWeek(new Date(), { weekStartsOn: 1 });

  const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
  const prevWeek = format(subWeeks(currentWeekStart, 1), "yyyy-MM-dd");
  const nextWeek = format(addWeeks(currentWeekStart, 1), "yyyy-MM-dd");

  const weekEnd = addWeeks(currentWeekStart, 1);
  const weekLabel = `${format(currentWeekStart, "d MMM", { locale: fr })} - ${format(
    new Date(weekEnd.getTime() - 86400000),
    "d MMM yyyy",
    { locale: fr }
  )}`;

  const planning = await getPlanningData(weekStartStr);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planning"
        description="Vue hebdomadaire des missions par operateur"
        showCreate={false}
      />

      {/* Week navigation */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/planning?week=${prevWeek}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="text-sm font-medium min-w-[200px] text-center">
          {weekLabel}
        </div>
        <Button variant="outline" size="icon" asChild>
          <Link href={`/planning?week=${nextWeek}`}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/planning">Aujourd&apos;hui</Link>
        </Button>
      </div>

      <PlanningView
        operators={planning.operators}
        unassigned={planning.unassigned}
        weekStart={weekStartStr}
      />
    </div>
  );
}
