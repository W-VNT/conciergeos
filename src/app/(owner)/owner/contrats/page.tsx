import { getOwnerContrats } from "@/lib/actions/owner-portal";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  type ContractStatus,
  type ContractType,
} from "@/types/database";

export default async function OwnerContratsPage() {
  const contrats = await getOwnerContrats();

  function statusColor(status: string) {
    switch (status) {
      case "ACTIF":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "SIGNE":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "EXPIRE":
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
      case "RESILIE":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mes contrats</h1>
        <p className="text-muted-foreground mt-1">
          {contrats.length} contrat{contrats.length !== 1 ? "s" : ""}
        </p>
      </div>

      {contrats.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">Aucun contrat</p>
            <p className="text-sm text-muted-foreground mt-1">
              Vos contrats apparaitront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {contrats.map((c) => {
            const logement = Array.isArray(c.logement)
              ? c.logement[0]
              : c.logement;
            return (
              <Card key={c.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">
                        {logement?.name ?? "Logement non defini"}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {CONTRACT_TYPE_LABELS[c.type as ContractType]} &middot;{" "}
                        Commission {c.commission_rate}%
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColor(
                        c.status
                      )}`}
                    >
                      {CONTRACT_STATUS_LABELS[c.status as ContractStatus]}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Du{" "}
                      {format(new Date(c.start_date), "d MMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                    <span>
                      au{" "}
                      {format(new Date(c.end_date), "d MMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                  </div>

                  {/* Auto-renew */}
                  {c.auto_renew && (
                    <p className="text-xs text-muted-foreground">
                      Renouvellement automatique ({c.renewal_duration_months}{" "}
                      mois)
                    </p>
                  )}

                  {/* Conditions */}
                  {c.conditions && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {c.conditions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
