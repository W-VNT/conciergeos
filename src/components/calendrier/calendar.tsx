"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Mission, Reservation, MissionType, MissionStatus, ReservationStatus } from "@/types/database";
import { MISSION_TYPE_LABELS, RESERVATION_STATUS_LABELS } from "@/types/database";
import Link from "next/link";

interface CalendarProps {
  missions: Mission[];
  reservations: Reservation[];
}

const MISSION_TYPE_COLORS: Record<MissionType, string> = {
  CHECKIN: "bg-blue-500",
  CHECKOUT: "bg-purple-500",
  MENAGE: "bg-green-500",
  INTERVENTION: "bg-orange-500",
  URGENCE: "bg-red-500",
};

const RESERVATION_STATUS_COLORS: Record<ReservationStatus, string> = {
  CONFIRMEE: "bg-emerald-100 border-emerald-400 text-emerald-900",
  ANNULEE: "bg-gray-100 border-gray-400 text-gray-500 line-through",
  TERMINEE: "bg-slate-100 border-slate-400 text-slate-600",
};

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export default function Calendar({ missions, reservations }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<ReservationStatus | "ALL">("ALL");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Adjust to make Monday = 0
  const firstDayAdjusted = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Get number of days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Get days from previous month to fill the grid
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Calculate calendar grid
  const calendarDays: Array<{
    date: Date;
    isCurrentMonth: boolean;
  }> = [];

  // Previous month days
  for (let i = firstDayAdjusted - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }

  // Next month days to complete the grid (6 rows x 7 days = 42 cells)
  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  // Filter reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      if (filterStatus !== "ALL" && reservation.status !== filterStatus) return false;
      return true;
    });
  }, [reservations, filterStatus]);

  // Group missions by date
  const missionsByDate = useMemo(() => {
    const grouped: Record<string, Mission[]> = {};

    missions.forEach((mission) => {
      const date = new Date(mission.scheduled_at);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(mission);
    });

    return grouped;
  }, [missions]);

  function getMissionsForDate(date: Date): Mission[] {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return missionsByDate[dateKey] || [];
  }

  // Check if a reservation spans a given date
  function getReservationsForDate(date: Date): Reservation[] {
    const dateTime = date.getTime();
    return filteredReservations.filter((reservation) => {
      const checkIn = new Date(reservation.check_in_date).getTime();
      const checkOut = new Date(reservation.check_out_date).getTime();
      // Include check-in day, exclude check-out day (standard hotel logic)
      return dateTime >= checkIn && dateTime < checkOut;
    });
  }

  function goToPreviousMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function goToNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[200px] text-center">
              <h2 className="text-xl font-semibold">
                {MONTHS[month]} {year}
              </h2>
            </div>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={goToToday}>
              Aujourd'hui
            </Button>
          </div>

          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                {Object.entries(RESERVATION_STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Calendar Grid */}
      <Card className="p-4">
        <div className="grid grid-cols-7 gap-px bg-border">
          {/* Day headers */}
          {DAYS.map((day) => (
            <div
              key={day}
              className="bg-muted p-2 text-center text-sm font-semibold"
            >
              {day}
            </div>
          ))}

          {/* Calendar cells */}
          {calendarDays.map((day, index) => {
            const dayMissions = getMissionsForDate(day.date);
            const dayReservations = getReservationsForDate(day.date);
            const isCurrentDay = isToday(day.date);

            return (
              <div
                key={index}
                className={`bg-background min-h-[140px] p-2 ${
                  !day.isCurrentMonth ? "opacity-40" : ""
                }`}
              >
                <div className="mb-1">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
                    isCurrentDay ? "bg-primary text-primary-foreground font-semibold" : ""
                  }`}>
                    {day.date.getDate()}
                  </span>
                </div>
                <div className="space-y-1">
                  {/* Display reservations */}
                  {dayReservations.map((reservation) => {
                    const logement = Array.isArray(reservation.logement)
                      ? reservation.logement[0]
                      : reservation.logement;
                    return (
                      <Link
                        key={reservation.id}
                        href={`/reservations/${reservation.id}`}
                        className="block"
                      >
                        <div
                          className={`text-xs p-1.5 rounded border-l-2 cursor-pointer hover:opacity-80 transition-opacity ${
                            RESERVATION_STATUS_COLORS[reservation.status]
                          }`}
                          title={`${reservation.guest_name} - ${logement?.name || "Logement"}`}
                        >
                          <div className="font-medium truncate">{logement?.name}</div>
                          <div className="text-[10px] truncate">{reservation.guest_name}</div>
                        </div>
                      </Link>
                    );
                  })}

                  {/* Display missions as small indicators */}
                  {dayMissions.length > 0 && (
                    <div className="flex gap-0.5 flex-wrap mt-1">
                      {dayMissions.slice(0, 4).map((mission) => (
                        <Link
                          key={mission.id}
                          href={`/missions/${mission.id}`}
                          title={`${MISSION_TYPE_LABELS[mission.type]} - ${new Date(mission.scheduled_at).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              MISSION_TYPE_COLORS[mission.type]
                            }`}
                          />
                        </Link>
                      ))}
                      {dayMissions.length > 4 && (
                        <div className="text-[9px] text-muted-foreground">+{dayMissions.length - 4}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Réservations</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(RESERVATION_STATUS_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-6 h-3 rounded border-l-2 ${RESERVATION_STATUS_COLORS[key as ReservationStatus]}`} />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">Missions (points)</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(MISSION_TYPE_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${MISSION_TYPE_COLORS[key as MissionType]}`} />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
