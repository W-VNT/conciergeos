"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      link: `/missions/${m.id}`,
    })),
    ...incidents.map((i) => ({
      id: i.id,
      type: "incident" as const,
      date: i.opened_at,
      title: "Incident",
      description: i.description,
      status: INCIDENT_SEVERITY_LABELS[i.severity],
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
      link: `/reservations/${r.id}`,
    })),
  ];

  // Sort by date descending
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Limit to last 20 events
  const recentEvents = events.slice(0, 20);

  function getIcon(type: string) {
    switch (type) {
      case "mission":
        return <CheckCircle2 className="h-5 w-5" />;
      case "incident":
        return <AlertCircle className="h-5 w-5" />;
      case "reservation":
        return <Home className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
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
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Historique de Maintenance
        </CardTitle>
        <CardDescription>
          {events.length} événement{events.length > 1 ? "s" : ""} enregistré{events.length > 1 ? "s" : ""}
        </CardDescription>
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
                  <div className="absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-border bg-background">
                    {getIcon(event.type)}
                  </div>

                  {/* Content */}
                  <div className="rounded-lg border p-3 hover:bg-muted/50 transition-colors">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
