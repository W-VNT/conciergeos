import { requireProfile, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAuditLogs, getAuditEntityTypes, getAuditActions } from "@/lib/actions/audit-logs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { AuditLogFilters } from "./audit-filters";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Journal d\u2019audit" };

interface PageProps {
  searchParams: {
    entity_type?: string;
    action?: string;
    user_id?: string;
    date_from?: string;
    date_to?: string;
    page?: string;
  };
}

export default async function AuditPage({ searchParams }: PageProps) {
  const profile = await requireProfile();
  if (!isAdmin(profile)) {
    redirect("/dashboard");
  }

  const page = Number(searchParams.page) || 1;

  const [result, entityTypes, actions] = await Promise.all([
    getAuditLogs({
      entity_type: searchParams.entity_type || undefined,
      action: searchParams.action || undefined,
      user_id: searchParams.user_id || undefined,
      date_from: searchParams.date_from || undefined,
      date_to: searchParams.date_to || undefined,
      page,
      per_page: 25,
    }),
    getAuditEntityTypes(),
    getAuditActions(),
  ]);

  const totalPages = Math.ceil(result.total / result.per_page);

  // Build pagination URL helper
  function buildUrl(newPage: number): string {
    const params = new URLSearchParams();
    if (searchParams.entity_type) params.set("entity_type", searchParams.entity_type);
    if (searchParams.action) params.set("action", searchParams.action);
    if (searchParams.user_id) params.set("user_id", searchParams.user_id);
    if (searchParams.date_from) params.set("date_from", searchParams.date_from);
    if (searchParams.date_to) params.set("date_to", searchParams.date_to);
    if (newPage > 1) params.set("page", String(newPage));
    const qs = params.toString();
    return `/audit${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" />
          Journal d&apos;audit
        </h1>
        <p className="text-muted-foreground mt-1">
          Historique complet des actions effectuées dans votre organisation
        </p>
      </div>

      <AuditLogFilters
        entityTypes={entityTypes}
        actions={actions}
        currentEntityType={searchParams.entity_type ?? ""}
        currentAction={searchParams.action ?? ""}
        currentDateFrom={searchParams.date_from ?? ""}
        currentDateTo={searchParams.date_to ?? ""}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Entrées</span>
            <Badge variant="secondary">{result.total} résultat{result.total !== 1 ? "s" : ""}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {result.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium px-4 py-3">Date</th>
                    <th className="text-left font-medium px-4 py-3">Utilisateur</th>
                    <th className="text-left font-medium px-4 py-3">Action</th>
                    <th className="text-left font-medium px-4 py-3">Entité</th>
                    <th className="text-left font-medium px-4 py-3">Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((log) => {
                    const user = log.user as { id: string; full_name: string; avatar_url: string | null } | null;
                    const changes = log.changes as Record<string, unknown> | null;
                    const changesPreview = changes
                      ? Object.keys(changes).slice(0, 3).join(", ")
                      : "";

                    return (
                      <tr key={log.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          {user?.full_name ?? "Système"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{log.action}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">{log.entity_type}</span>
                          {log.entity_id && (
                            <span className="text-muted-foreground text-xs ml-1">
                              ({log.entity_id.slice(0, 8)}...)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                          {changesPreview || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-muted-foreground">
              Aucune entrée trouvée
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={buildUrl(page - 1)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                Précédent
              </a>
            )}
            {page < totalPages && (
              <a
                href={buildUrl(page + 1)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                Suivant
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
