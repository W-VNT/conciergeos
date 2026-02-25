import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { getPreventiveSchedules, generateDueIncidents } from "@/lib/actions/preventive-maintenance";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CalendarClock, Zap } from "lucide-react";
import { PreventiveSchedulesSection } from "@/components/incidents/preventive-schedules-section";

export default async function PreventivePage() {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) redirect("/dashboard");

  const result = await getPreventiveSchedules();
  const schedules = result.data || [];
  const activeCount = schedules.filter((s: any) => s.active).length;
  const dueCount = schedules.filter((s: any) => s.active && new Date(s.next_due_date) <= new Date()).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/incidents">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarClock className="h-6 w-6" />
              Maintenance préventive
            </h1>
            <p className="text-sm text-muted-foreground">Planifications automatiques d&apos;inspections et d&apos;entretien</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Planifications</p>
            <p className="text-2xl font-bold">{schedules.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Actives</p>
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Échues (à générer)</p>
            <p className="text-2xl font-bold text-amber-600">{dueCount}</p>
          </CardContent>
        </Card>
      </div>

      <PreventiveSchedulesSection schedules={schedules} />
    </div>
  );
}
