"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { CalendarClock, Plus, Trash2, Power, PowerOff } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { deletePreventiveSchedule, toggleScheduleActive } from "@/lib/actions/preventive-maintenance";
import { PREVENTIVE_FREQUENCY_LABELS } from "@/types/database";
import type { PreventiveSchedule } from "@/types/database";

interface Props {
  schedules: PreventiveSchedule[];
  logementId?: string;
}

export function PreventiveSchedulesSection({ schedules, logementId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette planification ?")) return;
    startTransition(async () => {
      await deletePreventiveSchedule(id);
      router.refresh();
    });
  }

  async function handleToggle(id: string, active: boolean) {
    startTransition(async () => {
      await toggleScheduleActive(id, !active);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          Maintenance préventive
        </CardTitle>
      </CardHeader>
      <CardContent>
        {schedules.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune planification préventive.</p>
        ) : (
          <div className="space-y-3">
            {schedules.map((s: any) => (
              <div key={s.id} className={`flex items-center justify-between p-3 rounded-lg border ${!s.active ? "opacity-50" : ""}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{s.title}</p>
                    <StatusBadge value={s.severity} label={s.severity} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{PREVENTIVE_FREQUENCY_LABELS[s.frequency as keyof typeof PREVENTIVE_FREQUENCY_LABELS] || s.frequency}</span>
                    <span>Prochaine : {format(new Date(s.next_due_date), "d MMM yyyy", { locale: fr })}</span>
                    {s.logement && <span>{s.logement.name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isPending}
                    onClick={() => handleToggle(s.id, s.active)}
                    title={s.active ? "Désactiver" : "Activer"}
                  >
                    {s.active ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    disabled={isPending}
                    onClick={() => handleDelete(s.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
