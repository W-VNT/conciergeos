import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LOGEMENT_STATUS_LABELS, OFFER_TIER_LABELS, INCIDENT_SEVERITY_LABELS, INCIDENT_STATUS_LABELS } from "@/types/database";
import { deleteLogement } from "@/lib/actions/logements";
import { Pencil, Trash2, AlertTriangle, KeyRound, Wifi } from "lucide-react";
import Link from "next/link";
import { PhotoSection } from "@/components/shared/photo-section";
import { SyncIcalButton } from "@/components/shared/sync-ical-button";
import { InventaireSection } from "@/components/logements/inventaire-section";
import { ChecklistTemplateSection } from "@/components/logements/checklist-template-section";
import { HistoriqueMaintenance } from "@/components/logements/historique-maintenance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function LogementDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();

  const { data: logement } = await supabase.from("logements").select("*, proprietaire:proprietaires(*)").eq("id", params.id).single();
  if (!logement) notFound();

  const { data: attachments } = await supabase.from("attachments").select("*").eq("entity_type", "LOGEMENT").eq("entity_id", params.id).order("created_at", { ascending: false });
  const { data: missions } = await supabase.from("missions").select("*").eq("logement_id", params.id).order("scheduled_at", { ascending: false });
  const { data: incidents } = await supabase.from("incidents").select("*").eq("logement_id", params.id).order("opened_at", { ascending: false });
  const { data: reservations } = await supabase.from("reservations").select("*").eq("logement_id", params.id).order("check_in_date", { ascending: false });

  const prop = logement.proprietaire as { id: string; full_name: string } | null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={logement.name}
        showCreate={false}
        showBack={true}
        backHref="/logements"
      >
        <SyncIcalButton
          logementId={logement.id}
          hasIcalUrl={!!logement.ical_url}
          lastSyncedAt={logement.ical_last_synced_at}
        />
        {admin && (
          <>
            <Button variant="outline" asChild><Link href={`/logements/${logement.id}/edit`}><Pencil className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Modifier</span></Link></Button>
            <form action={async () => { "use server"; await deleteLogement(logement.id); }}>
              <Button variant="destructive" size="sm" type="submit"><Trash2 className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Supprimer</span></Button>
            </form>
          </>
        )}
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Adresse</span>
              <div className="text-right">
                {logement.address_line1 && <div>{logement.address_line1}</div>}
                {(logement.postal_code || logement.city) && (
                  <div>{[logement.postal_code, logement.city].filter(Boolean).join(" ")}</div>
                )}
                {!logement.address_line1 && !logement.postal_code && !logement.city && <span>—</span>}
              </div>
            </div>
            <div className="flex justify-between"><span className="text-muted-foreground">Offre</span><StatusBadge value={logement.offer_tier} label={OFFER_TIER_LABELS[logement.offer_tier as keyof typeof OFFER_TIER_LABELS]} /></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Statut</span><StatusBadge value={logement.status} label={LOGEMENT_STATUS_LABELS[logement.status as keyof typeof LOGEMENT_STATUS_LABELS]} /></div>
            {prop && <div className="flex justify-between"><span className="text-muted-foreground">Propriétaire</span><Link href={`/proprietaires/${prop.id}`} className="hover:underline">{prop.full_name}</Link></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Capacité</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Chambres</span><span>{logement.bedrooms ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Lits</span><span>{logement.beds ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Capacité max</span><span>{logement.max_guests ? `${logement.max_guests} voyageurs` : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Prix ménage</span><span>{logement.menage_price != null ? `${logement.menage_price} €` : "—"}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Accès</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 flex-shrink-0 text-amber-600" />
              <span className="text-muted-foreground">Boîte à clés</span>
              <code className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono font-bold text-amber-900 ml-1">{logement.lockbox_code || "—"}</code>
            </div>
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">{logement.wifi_name || "—"}</span>
              {logement.wifi_password && (
                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs ml-1">{logement.wifi_password}</code>
              )}
            </div>
            {logement.notes && <div><span className="text-muted-foreground">Notes</span><p className="mt-1">{logement.notes}</p></div>}
          </CardContent>
        </Card>
      </div>

      <PhotoSection organisationId={profile.organisation_id} entityType="LOGEMENT" entityId={params.id} initialAttachments={attachments ?? []} canUpload={admin} canDelete={admin} />

      <Tabs defaultValue="inventaire">
        <Card className="p-2 mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="inventaire">Inventaire</TabsTrigger>
            <TabsTrigger value="checklists">Checklists</TabsTrigger>
            <TabsTrigger value="incidents" className="flex items-center gap-2">
              Incidents
              {(incidents ?? []).filter(i => !["RESOLU", "CLOS"].includes(i.status)).length > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0 min-w-[1.25rem] h-5">
                  {(incidents ?? []).filter(i => !["RESOLU", "CLOS"].includes(i.status)).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="historique">Historique</TabsTrigger>
          </TabsList>
        </Card>

        <TabsContent value="inventaire" className="mt-4">
          <InventaireSection logementId={params.id} />
        </TabsContent>

        <TabsContent value="checklists" className="mt-4">
          <ChecklistTemplateSection logementId={params.id} />
        </TabsContent>

        <TabsContent value="incidents" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Incidents</CardTitle>
              <Button size="sm" asChild>
                <Link href={`/incidents/new?logement_id=${logement.id}`}>
                  <AlertTriangle className="h-4 w-4 mr-2" /> Nouvel incident
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sévérité</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Ouvert le</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(incidents ?? []).map((inc) => {
                    const isLate = !["RESOLU", "CLOS"].includes(inc.status) &&
                      (Date.now() - new Date(inc.opened_at).getTime()) > 7 * 24 * 60 * 60 * 1000;
                    return (
                      <TableRow key={inc.id}>
                        <TableCell>
                          <StatusBadge value={inc.severity} label={INCIDENT_SEVERITY_LABELS[inc.severity as keyof typeof INCIDENT_SEVERITY_LABELS]} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link href={`/incidents/${inc.id}`} className="hover:underline font-medium">
                              {(inc.description as string)?.slice(0, 60)}
                            </Link>
                            {isLate && <Badge variant="destructive" className="text-xs">En retard</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(inc.opened_at).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell>
                          <StatusBadge value={inc.status} label={INCIDENT_STATUS_LABELS[inc.status as keyof typeof INCIDENT_STATUS_LABELS]} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(incidents ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Aucun incident pour ce logement
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historique" className="mt-4">
          <HistoriqueMaintenance
            missions={missions ?? []}
            incidents={incidents ?? []}
            reservations={reservations ?? []}
          />
        </TabsContent>
      </Tabs>

    </div>
  );
}
