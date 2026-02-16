"use client";

import { Card } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";

interface Mission {
  id: string;
  type: string;
  scheduled_at: string;
  logement?: { name: string };
}

interface CalendarWidgetProps {
  missions: Mission[];
}

export function CalendarWidget({ missions }: CalendarWidgetProps) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Count today's and tomorrow's missions
  const todayMissions = missions.filter(m => {
    const missionDate = new Date(m.scheduled_at);
    return missionDate.toDateString() === today.toDateString();
  });

  const tomorrowMissions = missions.filter(m => {
    const missionDate = new Date(m.scheduled_at);
    return missionDate.toDateString() === tomorrow.toDateString();
  });

  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  return (
    <Link href="/missions">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wide">
                {dayNames[today.getDay()]}
              </p>
              <h2 className="text-6xl font-bold text-foreground mt-1">
                {today.getDate()}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {monthNames[today.getMonth()]} {today.getFullYear()}
              </p>
            </div>
            <CalendarIcon className="h-8 w-8 text-primary opacity-50" />
          </div>

          <div className="space-y-2 mt-4">
            {/* Today */}
            {todayMissions.length > 0 && (
              <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm font-medium">
                    {todayMissions.length} mission{todayMissions.length > 1 ? 's' : ''} aujourd'hui
                  </span>
                </div>
              </div>
            )}

            {/* Tomorrow */}
            {tomorrowMissions.length > 0 && (
              <div className="bg-background/60 backdrop-blur-sm rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">DEMAIN</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">
                    {tomorrowMissions.length} mission{tomorrowMissions.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}

            {/* No missions */}
            {todayMissions.length === 0 && tomorrowMissions.length === 0 && (
              <div className="bg-background/60 backdrop-blur-sm rounded-lg p-3 border">
                <p className="text-sm text-muted-foreground text-center">
                  Aucune mission prévue
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
