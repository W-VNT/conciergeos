"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, AlertCircle, Home } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Mission, Incident, Reservation } from "@/types/database";
import { MISSION_TYPE_LABELS, MISSION_STATUS_LABELS, INCIDENT_SEVERITY_LABELS, RESERVATION_STATUS_LABELS } from "@/types/database";
import Link from "next/link";

interface Props {
  missions: Mission[];
  incidents: Incident[];
  reservations: Reservation[];
}

type TimelineEvent = {
  id: string;
  type: "mission" | "incident" | "reservation";
  date: string;
  title: string;
  description: string;
  status: string;
  rawStatus: string;
  severity?: string;
  link: string;
};

export function HistoriqueMaintenance({ missions, incidents, reservations }: Props) {
  // Combine all events into timeline
  const events: TimelineEvent[] = [
    ...missions.map((m) => ({
      id: m.id,
      type: "mission" as const,
      date: m.scheduled_at,
      title: MISSION_TYPE_LABELS[m.type],
      description: m.notes || "",
      status: MISSION_STATUS_LABELS[m.status],
      rawStatus: m.status,
      link: `/missions/${m.id}`,
    })),
    ...incidents.map((i) => ({
      id: i.id,
      type: "incident" as const,
      date: i.opened_at,
      title: "Incident",
      description: i.description,
      status: INCIDENT_SEVERITY_LABELS[i.severity],
      rawStatus: i.severity,
      severity: i.severity,
      link: `/incidents/${i.id}`,
    })),
    ...reservations.map((r) => ({
      id: r.id,
      type: "reservation" as const,
      date: r.check_in_date,
      title: `Réservation - ${r.guest_name}`,
      description: `${r.guest_count} voyageur${r.guest_count > 1 ? "s" : ""}`,
      status: RESERVATION_STATUS_LABELS[r.status],
      rawStatus: r.status,
      link: `/reservations/${r.id}`,
    })),
  ];

  // Sort by date descending
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const PAGE_SIZE = 15;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const recentEvents = events.slice(0, visibleCount);
  const hasMore = visibleCount < events.length;

  function getColors(event: TimelineEvent): { icon: string; card: string } {
    if (event.type === "incident") {
      if (event.severity === "CRITIQUE") return { icon: "bg-red-500/15 border-red-400 text-red-600 dark:text-red-400", card: "border-red-500/20 bg-red-500/5" };
      if (event.severity === "MOYEN") return { icon: "bg-orange-500/15 border-orange-400 text-orange-600 dark:text-orange-400", card: "border-orange-500/20 bg-orange-500/5" };
      return { icon: "bg-yellow-500/15 border-yellow-400 text-yellow-600 dark:text-yellow-400", card: "border-yellow-500/20 bg-yellow-500/5" };
    }
    if (event.type === "reservation") {
      return { icon: "bg-blue-500/15 border-blue-400 text-blue-600 dark:text-blue-400", card: "border-blue-500/20 bg-blue-500/5" };
    }
    // mission
    if (event.rawStatus === "TERMINE") return { icon: "bg-green-500/15 border-green-400 text-green-600 dark:text-green-400", card: "border-green-500/20 bg-green-500/5" };
    if (event.rawStatus === "EN_COURS") return { icon: "bg-blue-500/15 border-blue-400 text-blue-600 dark:text-blue-400", card: "border-blue-500/20 bg-blue-500/5" };
    if (event.rawStatus === "ANNULE") return { icon: "bg-muted border-border text-muted-foreground", card: "border-border bg-muted/30" };
    return { icon: "bg-orange-500/15 border-orange-400 text-orange-600 dark:text-orange-400", card: "border-orange-500/20 bg-orange-500/5" }; // A_FAIRE
  }

  function getIcon(event: TimelineEvent) {
    switch (event.type) {
      case "mission":
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "incident":
        return <AlertCircle className="h-3.5 w-3.5" />;
      case "reservation":
        return <Home className="h-3.5 w-3.5" />;
      default:
        return <Calendar className="h-3.5 w-3.5" />;
    }
  }

  function getBadgeVariant(event: TimelineEvent) {
    if (event.type === "incident") {
      if (event.severity === "CRITIQUE") return "destructive";
      if (event.severity === "MOYEN") return "secondary";
      return "outline";
    }
    return "secondary";
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historique de Maintenance
            </CardTitle>
            <CardDescription>
              {events.length} événement{events.length > 1 ? "s" : ""} enregistré{events.length > 1 ? "s" : ""}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-400 inline-block" />Terminé</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-400 inline-block" />À faire</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-400 inline-block" />En cours / Réservation</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400 inline-block" />Incident critique</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground inline-block" />Annulé</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {recentEvents.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucun événement enregistré pour ce logement
          </p>
        ) : (
          <div className="space-y-4">
            {recentEvents.map((event, index) => (
              <Link
                key={event.id}
                href={event.link}
                className="block"
              >
                <div className="relative pl-8 pb-4">
                  {/* Timeline line */}
                  {index < recentEvents.length - 1 && (
                    <div className="absolute left-2.5 top-7 bottom-0 w-0.5 bg-border" />
                  )}

                  {/* Icon */}
                  <div className={`absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 ${getColors(event).icon}`}>
                    {getIcon(event)}
                  </div>

                  {/* Content */}
                  <div className={`rounded-lg border p-3 transition-colors hover:brightness-95 ${getColors(event).card}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{event.title}</span>
                          <Badge variant={getBadgeVariant(event)} className="text-xs">
                            {event.status}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <time className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(event.date), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </time>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                >
                  Afficher plus ({events.length - visibleCount} restant{events.length - visibleCount > 1 ? "s" : ""})
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
