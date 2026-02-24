import { getOwnerIncidents } from "@/lib/actions/owner-portal";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_CATEGORY_LABELS,
  type IncidentSeverity,
  type IncidentStatus,
  type IncidentCategory,
} from "@/types/database";

export default async function OwnerIncidentsPage() {
  const incidents = await getOwnerIncidents();

  function severityColor(severity: string) {
    switch (severity) {
      case "CRITIQUE":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "MOYEN":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "MINEUR":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  }

  function statusColor(status: string) {
    switch (status) {
      case "OUVERT":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "EN_COURS":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "RESOLU":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "CLOS":
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Incidents</h1>
        <p className="text-muted-foreground mt-1">
          {incidents.length} incident{incidents.length !== 1 ? "s" : ""} sur vos
          logements
        </p>
      </div>

      {incidents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">Aucun incident</p>
            <p className="text-sm text-muted-foreground mt-1">
              Les incidents sur vos logements apparaitront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => {
            const logement = Array.isArray(incident.logement)
              ? incident.logement[0]
              : incident.logement;
            return (
              <Card
                key={incident.id}
                className="overflow-hidden"
              >
                <CardContent className="p-4 space-y-2">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {logement?.name ?? "Logement inconnu"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {incident.category
                          ? INCIDENT_CATEGORY_LABELS[
                              incident.category as IncidentCategory
                            ]
                          : "Non categorise"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColor(
                          incident.severity
                        )}`}
                      >
                        {
                          INCIDENT_SEVERITY_LABELS[
                            incident.severity as IncidentSeverity
                          ]
                        }
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(
                          incident.status
                        )}`}
                      >
                        {
                          INCIDENT_STATUS_LABELS[
                            incident.status as IncidentStatus
                          ]
                        }
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {incident.description}
                  </p>

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t">
                    <span>
                      Ouvert le{" "}
                      {format(new Date(incident.opened_at), "d MMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                    {incident.resolved_at && (
                      <span>
                        Resolu le{" "}
                        {format(
                          new Date(incident.resolved_at),
                          "d MMM yyyy",
                          { locale: fr }
                        )}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
