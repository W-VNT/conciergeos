"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OperatorStat } from "@/lib/actions/operator-stats";

interface OperatorStatsSectionProps {
  stats: OperatorStat[];
}

function formatMinutes(minutes: number): string {
  if (minutes === 0) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

function getLateRateBadge(rate: number) {
  if (rate < 20) {
    return <StatusBadge value="ACTIF" label={`${rate} %`} />;
  }
  if (rate < 50) {
    return <StatusBadge value="EN_ATTENTE" label={`${rate} %`} />;
  }
  return <StatusBadge value="CRITIQUE" label={`${rate} %`} />;
}

export function OperatorStatsSection({ stats }: OperatorStatsSectionProps) {
  const [open, setOpen] = useState(false);

  if (stats.length === 0) return null;

  return (
    <Card className="mb-4">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <span>Statistiques opérateurs</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="p-0">
          {/* Mobile: card list */}
          <div className="md:hidden divide-y">
            {stats.map((s) => (
              <div key={s.operator_id} className="px-4 py-3 space-y-2">
                <p className="font-medium">{s.operator_name}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Terminées</span>
                  <span className="text-right">{s.missions_completed}</span>
                  <span className="text-muted-foreground">Temps moy.</span>
                  <span className="text-right">{formatMinutes(s.avg_time_minutes)}</span>
                  <span className="text-muted-foreground">Taux retard</span>
                  <span className="text-right">{getLateRateBadge(s.late_rate)}</span>
                  <span className="text-muted-foreground">En cours</span>
                  <span className="text-right">{s.missions_pending}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Opérateur</th>
                  <th className="px-4 py-3 font-medium text-right">Missions terminées</th>
                  <th className="px-4 py-3 font-medium text-right">Temps moyen</th>
                  <th className="px-4 py-3 font-medium text-center">Taux retard</th>
                  <th className="px-4 py-3 font-medium text-right">En cours</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.operator_id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{s.operator_name}</td>
                    <td className="px-4 py-3 text-right">{s.missions_completed}</td>
                    <td className="px-4 py-3 text-right">{formatMinutes(s.avg_time_minutes)}</td>
                    <td className="px-4 py-3 text-center">{getLateRateBadge(s.late_rate)}</td>
                    <td className="px-4 py-3 text-right">{s.missions_pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
