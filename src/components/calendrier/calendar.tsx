"use client";

import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import type { Mission, Reservation, MissionType, MissionStatus, ReservationStatus } from "@/types/database";
import { MISSION_TYPE_LABELS, RESERVATION_STATUS_LABELS } from "@/types/database";
import Link from "next/link";
import { formatTime } from "@/lib/format-date";

type ViewType = "jour" | "semaine" | "mois" | "annee";

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

const MISSION_TYPE_BORDER_COLORS: Record<MissionType, string> = {
  CHECKIN: "border-l-blue-500",
  CHECKOUT: "border-l-purple-500",
  MENAGE: "border-l-green-500",
  INTERVENTION: "border-l-orange-500",
  URGENCE: "border-l-red-500",
};

const RESERVATION_STATUS_COLORS: Record<ReservationStatus, string> = {
  CONFIRMEE: "bg-emerald-100 border-emerald-400 text-emerald-900",
  ANNULEE: "bg-red-100 border-red-400 text-red-700 line-through",
  TERMINEE: "bg-blue-100 border-blue-400 text-blue-800",
};

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_SHORT = ["L", "M", "M", "J", "V", "S", "D"];
const DAYS_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

export default function Calendar({ missions, reservations }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>("semaine");

  useEffect(() => {
    if (window.innerWidth < 768) {
      setView("jour");
    }
  }, []);
  const [filterStatus, setFilterStatus] = useState<ReservationStatus | "ALL">("ALL");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // --- Navigation ---
  function goToPrev() {
    const d = new Date(currentDate);
    if (view === "jour") d.setDate(d.getDate() - 1);
    else if (view === "semaine") d.setDate(d.getDate() - 7);
    else if (view === "mois") d.setMonth(d.getMonth() - 1);
    else d.setFullYear(d.getFullYear() - 1);
    setCurrentDate(d);
  }

  function goToNext() {
    const d = new Date(currentDate);
    if (view === "jour") d.setDate(d.getDate() + 1);
    else if (view === "semaine") d.setDate(d.getDate() + 7);
    else if (view === "mois") d.setMonth(d.getMonth() + 1);
    else d.setFullYear(d.getFullYear() + 1);
    setCurrentDate(d);
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  // --- Header label ---
  function getHeaderLabel() {
    if (view === "jour") {
      const dayName = DAYS_FULL[(currentDate.getDay() + 6) % 7];
      return `${dayName} ${currentDate.getDate()} ${MONTHS[month]} ${year}`;
    }
    if (view === "semaine") {
      const start = getWeekStart(currentDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()} – ${end.getDate()} ${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
      }
      return `${start.getDate()} ${MONTHS[start.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
    }
    if (view === "annee") return `${year}`;
    return `${MONTHS[month]} ${year}`;
  }

  // --- Filtered data ---
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => filterStatus === "ALL" || r.status === filterStatus);
  }, [reservations, filterStatus]);

  function getMissionsForDate(date: Date): Mission[] {
    return missions.filter((m) => isSameDay(new Date(m.scheduled_at), date));
  }

  function getReservationsForDate(date: Date): Reservation[] {
    return filteredReservations.filter((r) => {
      const checkIn = new Date(r.check_in_date).getTime();
      const checkOut = new Date(r.check_out_date).getTime();
      return date.getTime() >= checkIn && date.getTime() < checkOut;
    });
  }

  function isToday(date: Date) {
    return isSameDay(date, new Date());
  }

  // --- Month grid data ---
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const firstDayAdjusted = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    for (let i = firstDayAdjusted - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  }, [year, month]);

  // --- Week days ---
  const weekDays = useMemo(() => {
    const start = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  // --- View toggle buttons ---
  const views: { key: ViewType; label: string; mobileClass?: string }[] = [
    { key: "jour", label: "Jour" },
    { key: "semaine", label: "Semaine" },
    { key: "mois", label: "Mois", mobileClass: "hidden sm:flex" },
    { key: "annee", label: "Année", mobileClass: "hidden sm:flex" },
  ];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="p-4">
        <div className="space-y-3">
          {/* Row 1: Navigation centrée */}
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base font-semibold text-center">{getHeaderLabel()}</h2>
            <Button variant="outline" size="icon" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Row 2: View tabs + Aujourd'hui + filtre statut (desktop) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-lg p-1 gap-0.5 flex-1">
              {views.map(({ key, label, mobileClass }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`flex-1 flex items-center justify-center px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
                    view === key
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  } ${mobileClass ?? ""}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Aujourd&apos;hui
            </Button>
            {view !== "jour" && (
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="!h-9 text-sm hidden sm:flex w-auto px-3">
                  <span className="truncate">
                    {filterStatus === "ALL" ? "Statut" : RESERVATION_STATUS_LABELS[filterStatus as keyof typeof RESERVATION_STATUS_LABELS]}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
                  {Object.entries(RESERVATION_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </Card>

      {/* ── VUE JOUR ── */}
      {view === "jour" && (() => {
        const dayReservations = getReservationsForDate(currentDate);
        const dayMissions = getMissionsForDate(currentDate).sort(
          (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        );
        const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7h-22h

        // Group missions by hour
        const missionsByHour: Record<number, Mission[]> = {};
        dayMissions.forEach((m) => {
          const hour = new Date(m.scheduled_at).getHours();
          const clamped = Math.max(7, Math.min(22, hour));
          if (!missionsByHour[clamped]) missionsByHour[clamped] = [];
          missionsByHour[clamped].push(m);
        });

        const hasEvents = dayReservations.length > 0 || dayMissions.length > 0;

        return (
          <Card className="p-0 overflow-hidden">
            {/* Reservations - all day banner */}
            {dayReservations.length > 0 && (
              <div className="p-3 border-b bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Réservations</p>
                <div className="space-y-1.5">
                  {dayReservations.map((r) => {
                    const logement = Array.isArray(r.logement) ? r.logement[0] : r.logement;
                    return (
                      <Link key={r.id} href={`/reservations/${r.id}`} className="block">
                        <div className={`text-sm px-3 py-2 rounded border-l-4 ${RESERVATION_STATUS_COLORS[r.status]}`}>
                          <span className="font-medium">{logement?.name}</span>
                          <span className="text-xs opacity-75 ml-2">{r.guest_name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hourly grid */}
            {hasEvents ? (
              <div className="divide-y">
                {HOURS.map((hour) => {
                  const missions = missionsByHour[hour] || [];
                  const now = new Date();
                  const isCurrentHour = isToday(currentDate) && now.getHours() === hour;

                  return (
                    <div key={hour} className={`flex min-h-[3.5rem] ${isCurrentHour ? "bg-primary/5" : ""}`}>
                      <div className="w-14 flex-shrink-0 px-2 py-3 text-xs font-mono text-muted-foreground text-right border-r">
                        {String(hour).padStart(2, "0")}:00
                      </div>
                      <div className="flex-1 px-2 py-2 space-y-1">
                        {missions.map((m) => {
                          const logement = m.logement as { name: string } | null;
                          return (
                            <Link key={m.id} href={`/missions/${m.id}`} className="block">
                              <div className={`flex items-center gap-2 px-2.5 py-2.5 rounded border-l-4 bg-muted/40 hover:bg-muted transition-colors ${MISSION_TYPE_BORDER_COLORS[m.type as MissionType]}`}>
                                <span className="text-xs font-mono text-muted-foreground">
                                  {formatTime(m.scheduled_at)}
                                </span>
                                <span className="text-sm font-medium">{MISSION_TYPE_LABELS[m.type as MissionType]}</span>
                                <span className="text-xs text-muted-foreground truncate">{logement?.name}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                variant="inline"
                icon={CalendarIcon}
                title="Aucun événement ce jour"
              />
            )}
          </Card>
        );
      })()}

      {/* ── VUE SEMAINE ── */}
      {view === "semaine" && (
        <Card className="p-2 sm:p-4">
          <div className="grid grid-cols-7 gap-px bg-border">
            {weekDays.map((day, i) => (
              <div key={i} className="bg-background p-1 sm:p-2">
                <div className="mb-1 sm:mb-2 text-center">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    <span className="sm:hidden">{DAYS_SHORT[i]}</span>
                    <span className="hidden sm:inline">{DAYS[i]}</span>
                  </p>
                  <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs sm:text-sm font-medium ${
                    isToday(day) ? "bg-primary text-primary-foreground" : ""
                  }`}>
                    {day.getDate()}
                  </span>
                </div>
                <div className="space-y-1 min-h-[60px] sm:min-h-[120px]">
                  {getReservationsForDate(day).map((r) => {
                    const logement = Array.isArray(r.logement) ? r.logement[0] : r.logement;
                    return (
                      <Link key={r.id} href={`/reservations/${r.id}`} className="block">
                        <div className={`text-[10px] p-0.5 sm:p-1 rounded border-l-2 leading-tight ${RESERVATION_STATUS_COLORS[r.status]}`}>
                          <div className="font-medium truncate">{logement?.name}</div>
                        </div>
                      </Link>
                    );
                  })}
                  {getMissionsForDate(day).map((m) => (
                    <Link key={m.id} href={`/missions/${m.id}`} className="block">
                      <div className={`text-[10px] p-0.5 sm:p-1 rounded border-l-2 bg-muted/40 leading-tight ${MISSION_TYPE_BORDER_COLORS[m.type as MissionType]}`}>
                        <div className="font-medium truncate flex items-center gap-0.5 sm:gap-1">
                          <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${MISSION_TYPE_COLORS[m.type as MissionType]}`} />
                          <span className="hidden sm:inline">{formatTime(m.scheduled_at)}</span>
                          <span className="truncate">{MISSION_TYPE_LABELS[m.type as MissionType]}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── VUE MOIS ── */}
      {view === "mois" && (
        <Card className="p-4">
          <div className="grid grid-cols-7 gap-px bg-border">
            {DAYS.map((day) => (
              <div key={day} className="bg-muted p-2 text-center text-sm font-semibold">
                {day}
              </div>
            ))}
            {calendarDays.map((day, index) => {
              const dayMissions = getMissionsForDate(day.date);
              const dayReservations = getReservationsForDate(day.date);
              const isCurrentDay = isToday(day.date);

              return (
                <div
                  key={index}
                  className={`bg-background min-h-[120px] p-2 ${!day.isCurrentMonth ? "opacity-40" : ""}`}
                >
                  <div className="mb-1">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
                      isCurrentDay ? "bg-primary text-primary-foreground font-semibold" : ""
                    }`}>
                      {day.date.getDate()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayReservations.map((reservation) => {
                      const logement = Array.isArray(reservation.logement) ? reservation.logement[0] : reservation.logement;
                      return (
                        <Link key={reservation.id} href={`/reservations/${reservation.id}`} className="block">
                          <div className={`text-xs p-1.5 rounded border-l-2 hover:opacity-80 transition-opacity ${RESERVATION_STATUS_COLORS[reservation.status]}`}>
                            <div className="font-medium truncate">{logement?.name}</div>
                            <div className="text-[10px] truncate">{reservation.guest_name}</div>
                          </div>
                        </Link>
                      );
                    })}
                    {dayMissions.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {Object.entries(
                          dayMissions.reduce<Record<string, number>>((acc, m) => {
                            acc[m.type] = (acc[m.type] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([type, count]) => (
                          <span
                            key={type}
                            className={`inline-flex items-center gap-0.5 text-[10px] font-medium text-white px-1.5 py-0.5 rounded-full leading-none ${MISSION_TYPE_COLORS[type as MissionType]}`}
                            title={`${count} ${MISSION_TYPE_LABELS[type as MissionType]}`}
                          >
                            {count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── VUE ANNÉE ── */}
      {view === "annee" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }, (_, i) => {
            const monthDate = new Date(year, i, 1);
            const firstDay = monthDate.getDay();
            const firstDayAdj = firstDay === 0 ? 6 : firstDay - 1;
            const daysInThisMonth = new Date(year, i + 1, 0).getDate();
            const miniDays: (number | null)[] = Array(firstDayAdj).fill(null);
            for (let d = 1; d <= daysInThisMonth; d++) miniDays.push(d);
            while (miniDays.length % 7 !== 0) miniDays.push(null);

            const monthMissions = missions.filter((m) => {
              const d = new Date(m.scheduled_at);
              return d.getFullYear() === year && d.getMonth() === i;
            });

            return (
              <Card
                key={i}
                className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setCurrentDate(new Date(year, i, 1));
                  setView("mois");
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">{MONTHS[i]}</p>
                  {monthMissions.length > 0 && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                      {monthMissions.length}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-7 gap-px">
                  {["L", "M", "M", "J", "V", "S", "D"].map((d, idx) => (
                    <div key={idx} className="text-[9px] text-center text-muted-foreground font-medium py-0.5">{d}</div>
                  ))}
                  {miniDays.map((day, idx) => {
                    const isCurrentDay = day !== null && isSameDay(new Date(year, i, day), new Date());
                    return (
                      <div key={idx} className={`text-[10px] text-center py-0.5 rounded-full ${
                        isCurrentDay ? "bg-primary text-primary-foreground font-semibold" : "text-foreground"
                      } ${day === null ? "invisible" : ""}`}>
                        {day ?? "·"}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Legend */}
      {view !== "annee" && (
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
              <h3 className="text-sm font-semibold mb-2">Missions</h3>
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
      )}
    </div>
  );
}
