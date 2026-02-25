"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import type { Mission, Reservation, MissionType, ReservationStatus } from "@/types/database";
import { MISSION_TYPE_LABELS } from "@/types/database";

const MISSION_TYPE_COLORS: Record<string, string> = {
  CHECKIN: "bg-blue-500",
  CHECKOUT: "bg-purple-500",
  MENAGE: "bg-green-500",
  INTERVENTION: "bg-orange-500",
  URGENCE: "bg-red-500",
};

const RESERVATION_STATUS_COLORS: Record<string, string> = {
  CONFIRMEE: "bg-emerald-100 border-emerald-500 dark:bg-emerald-950/40",
  EN_ATTENTE: "bg-amber-100 border-amber-500 dark:bg-amber-950/40",
  ANNULEE: "bg-red-100 border-red-500 dark:bg-red-950/40",
  TERMINEE: "bg-blue-100 border-blue-500 dark:bg-blue-950/40",
};

interface MultiLogementViewProps {
  missions: Mission[];
  reservations: Reservation[];
  logements: { id: string; name: string }[];
  weekDays: Date[];
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function MultiLogementView({ missions, reservations, logements, weekDays }: MultiLogementViewProps) {
  const dayLabels = useMemo(() => {
    const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    return weekDays.map((d) => ({
      label: `${DAYS[d.getDay()]} ${d.getDate()}`,
      date: d,
    }));
  }, [weekDays]);

  function getMissionsForLogementAndDay(logementId: string, day: Date) {
    return missions.filter((m: any) => {
      const logId = typeof m.logement_id === "string" ? m.logement_id : m.logement?.id;
      if (logId !== logementId) return false;
      if (!m.scheduled_at) return false;
      return isSameDay(new Date(m.scheduled_at), day);
    });
  }

  function getReservationsForLogementAndDay(logementId: string, day: Date) {
    return reservations.filter((r: any) => {
      const logId = typeof r.logement_id === "string" ? r.logement_id : r.logement?.id;
      if (logId !== logementId) return false;
      const checkIn = new Date(r.check_in_date);
      const checkOut = new Date(r.check_out_date);
      return day >= checkIn && day <= checkOut;
    });
  }

  const isToday = (d: Date) => isSameDay(d, new Date());

  if (logements.length === 0) {
    return <Card className="p-6 text-center text-muted-foreground">Aucun logement disponible.</Card>;
  }

  return (
    <Card className="p-2 sm:p-4 overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left p-2 border-b font-medium text-muted-foreground sticky left-0 bg-background z-10 min-w-[120px]">Logement</th>
            {dayLabels.map((d, i) => (
              <th key={i} className={`text-center p-2 border-b font-medium min-w-[100px] ${isToday(d.date) ? "bg-primary/5 text-primary" : "text-muted-foreground"}`}>
                {d.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logements.map((logement) => (
            <tr key={logement.id} className="border-b last:border-0">
              <td className="p-2 font-medium text-sm sticky left-0 bg-background z-10 border-r">
                <Link href={`/logements/${logement.id}`} className="hover:underline text-primary">
                  {logement.name}
                </Link>
              </td>
              {weekDays.map((day, i) => {
                const dayMissions = getMissionsForLogementAndDay(logement.id, day);
                const dayReservations = getReservationsForLogementAndDay(logement.id, day);
                return (
                  <td key={i} className={`p-1 align-top border-r last:border-0 ${isToday(day) ? "bg-primary/5" : ""}`}>
                    <div className="space-y-0.5 min-h-[40px]">
                      {dayReservations.map((r: any) => (
                        <Link key={r.id} href={`/reservations/${r.id}`} className="block">
                          <div className={`p-0.5 rounded text-[10px] border-l-2 truncate ${RESERVATION_STATUS_COLORS[r.status] || "bg-muted"}`}>
                            {r.guest_name}
                          </div>
                        </Link>
                      ))}
                      {dayMissions.map((m: any) => (
                        <Link key={m.id} href={`/missions/${m.id}`} className="block">
                          <div className="flex items-center gap-0.5 text-[10px]">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${MISSION_TYPE_COLORS[m.type] || "bg-gray-500"}`} />
                            <span className="truncate">{MISSION_TYPE_LABELS[m.type as MissionType] || m.type}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
