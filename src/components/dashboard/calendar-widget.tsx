"use client";

import Link from "next/link";
import { MISSION_TYPE_LABELS } from "@/types/database";
import { StatusBadge } from "@/components/shared/status-badge";

interface Mission {
  id: string;
  type: string;
  scheduled_at: string;
  status: string;
  logement?: {
    name: string;
  };
}

interface CalendarWidgetProps {
  missions: Mission[];
}

export function CalendarWidget({ missions }: CalendarWidgetProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  // Filter missions for today and tomorrow
  const todayMissions = missions.filter((m) => {
    const missionDate = new Date(m.scheduled_at);
    return missionDate >= today && missionDate < tomorrow;
  });

  const tomorrowMissions = missions.filter((m) => {
    const missionDate = new Date(m.scheduled_at);
    return missionDate >= tomorrow && missionDate < dayAfterTomorrow;
  });

  const monthNames = [
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return `${date.getDate()} ${monthNames[date.getMonth()].slice(0, 3)}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      {/* Missions List */}
      <div className="flex-1 overflow-y-auto">
        {/* Today Section */}
        <div className="border-b border-gray-100">
          <div className="px-4 py-2 bg-gray-50">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Aujourd&apos;hui · {formatDate(today)}
            </p>
          </div>
          {todayMissions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {todayMissions.map((mission) => (
                <Link
                  key={mission.id}
                  href={`/missions/${mission.id}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <StatusBadge value={mission.type} label={MISSION_TYPE_LABELS[mission.type as keyof typeof MISSION_TYPE_LABELS]} />
                      <span className="text-xs text-gray-500">{formatTime(mission.scheduled_at)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {mission.logement?.name || "Sans logement"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-4 py-3 text-sm text-gray-400 italic">Aucune mission</p>
          )}
        </div>

        {/* Tomorrow Section */}
        <div className="border-b border-gray-100">
          <div className="px-4 py-2 bg-gray-50">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Demain · {formatDate(tomorrow)}
            </p>
          </div>
          {tomorrowMissions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {tomorrowMissions.map((mission) => (
                <Link
                  key={mission.id}
                  href={`/missions/${mission.id}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <StatusBadge value={mission.type} label={MISSION_TYPE_LABELS[mission.type as keyof typeof MISSION_TYPE_LABELS]} />
                      <span className="text-xs text-gray-500">{formatTime(mission.scheduled_at)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {mission.logement?.name || "Sans logement"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-4 py-3 text-sm text-gray-400 italic">Aucune mission</p>
          )}
        </div>
      </div>

      {/* Footer - View All */}
      <Link
        href="/calendrier"
        className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-center hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-medium text-blue-600">
          Voir le calendrier complet →
        </span>
      </Link>
    </div>
  );
}
