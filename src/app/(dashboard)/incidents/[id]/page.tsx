import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { INCIDENT_SEVERITY_LABELS, INCIDENT_STATUS_LABELS, INCIDENT_CATEGORY_LABELS, MISSION_TYPE_LABELS } from "@/types/database";
import { formatCurrencyDecimals } from "@/lib/format-currency";
import { deleteIncident } from "@/lib/actions/incidents";
import { Pencil, History, Clock } from "lucide-react";
import Link from "next/link";
import { PhotoSection } from "@/components/shared/photo-section";
import { UpdateIncidentStatusButton } from "@/components/shared/update-incident-status-button";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { getActivityLogs } from "@/lib/actions/activity-logs";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { checkIncidentSla } from "@/lib/actions/sla";
import { DevisSection } from "@/components/incidents/devis-section";
import { FactureSection } from "@/components/incidents/facture-section";
import { ResponseTemplatesSection } from "@/components/incidents/response-templates-section";
import { getIncidentTemplates } from "@/lib/actions/incident-templates";
import type { Prestataire } from "@/types/database";

export default async function IncidentDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();

  const { data: incident } = await supabase
    .from("incidents")
    .select("*, logement:logements(id, name), prestataire:prestataires(id, full_name), mission:missions(id, type, reservation_id)")
    .eq("id", params.id)
    .eq("organisation_id", profile.organisation_id)
    .single();
  if (!incident) notFound();

  const { data: attachments } = await supabase.from("attachments").select("*").eq("entity_type", "INCIDENT").eq("entity_id", params.id).eq("organisation_id", profile.organisation_id).order("created_at", { ascending: false });

  const logement = incident.logement as { id: string; name: string } | null;
  const prestataire = incident.prestataire as { id: string; full_name: string } | null;
  const mission = incident.mission as { id: string; type: string; reservation_id: string | null } | null;

  // Fetch reservation if mission has one
  let reservation: { id: string; guest_name: string } | null = null;
  if (mission?.reservation_id) {
    const { data } = await supabase.from("reservations").select("id, guest_name").eq("id", mission.reservation_id).eq("organisation_id", profile.organisation_id).single();
    reservation = data;
  }

  // Fetch activity logs, SLA status, prestataires, and templates in parallel
  const [activityLogs, slaStatus, { data: prestataires }, templates] = await Promise.all([
    getActivityLogs("INCIDENT", params.id),
    checkIncidentSla(incident),
    supabase.from("prestataires").select("*").eq("organisation_id", profile.organisation_id).order("full_name"),
    getIncidentTemplates(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Détail incident"
        showCreate={false}
        showBack={true}
        backHref="/incidents"
        entityName={incident.description?.slice(0, 50)}
      >
        <Button variant="outline" asChild><Link href={`/incidents/${incident.id}/edit`}><Pencil className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Modifier</span></Link></Button>
        {admin && (
          <DeleteConfirmDialog
            entityType="incident"
            entityName={incident.description.slice(0, 50) + (incident.description.length > 50 ? "..." : "")}
            deleteAction={async () => {
              "use server";
              return await deleteIncident(incident.id);
            }}
            redirectPath="/incidents"
          />
        )}
      </PageHeader>
      <Card>
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Sévérité</span><StatusBadge value={incident.severity} label={INCIDENT_SEVERITY_LABELS[incident.severity as keyof typeof INCIDENT_SEVERITY_LABELS]} /></div>
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Statut</span><UpdateIncidentStatusButton incidentId={incident.id} currentStatus={incident.status as "OUVERT" | "EN_COURS" | "RESOLU" | "CLOS"} /></div>
          {slaStatus.maxHours !== null && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">SLA</span>
              <SlaBadge slaStatus={slaStatus} />
            </div>
          )}
          {incident.category && <div className="flex justify-between"><span className="text-muted-foreground">Catégorie</span><span>{INCIDENT_CATEGORY_LABELS[incident.category as keyof typeof INCIDENT_CATEGORY_LABELS] ?? incident.category}</span></div>}
          {logement && <div className="flex justify-between"><span className="text-muted-foreground">Logement</span><Link href={`/logements/${logement.id}`} className="hover:underline">{logement.name}</Link></div>}
          {mission && <div className="flex justify-between"><span className="text-muted-foreground">Mission liée</span><Link href={`/missions/${mission.id}`} className="hover:underline">{MISSION_TYPE_LABELS[mission.type as keyof typeof MISSION_TYPE_LABELS] ?? mission.type}</Link></div>}
          {reservation && <div className="flex justify-between"><span className="text-muted-foreground">Réservation</span><Link href={`/reservations/${reservation.id}`} className="hover:underline">{reservation.guest_name}</Link></div>}
          {prestataire && <div className="flex justify-between"><span className="text-muted-foreground">Prestataire</span><Link href={`/prestataires/${prestataire.id}`} className="hover:underline">{prestataire.full_name}</Link></div>}
          <div><span className="text-muted-foreground">Description</span><p className="mt-1">{incident.description}</p></div>
          {incident.cost != null && <div className="flex justify-between"><span className="text-muted-foreground">Coût</span><span>{formatCurrencyDecimals(incident.cost)}</span></div>}
          {incident.expected_resolution_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Résolution prévue</span>
              <span>{new Date(incident.expected_resolution_date + "T00:00:00").toLocaleDateString("fr-FR")}</span>
            </div>
          )}
          <div className="flex justify-between"><span className="text-muted-foreground">Ouvert le</span><span>{new Date(incident.opened_at).toLocaleString("fr-FR")}</span></div>
          {incident.resolved_at && <div className="flex justify-between"><span className="text-muted-foreground">Résolu le</span><span>{new Date(incident.resolved_at).toLocaleString("fr-FR")}</span></div>}
        </CardContent>
      </Card>
      {incident.notes && (
        <Card>
          <CardHeader><CardTitle>Notes / Suivi</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{incident.notes}</p>
          </CardContent>
        </Card>
      )}
      <ResponseTemplatesSection
        organisationId={profile.organisation_id}
        isAdmin={admin}
        templates={templates}
      />
      <PhotoSection organisationId={profile.organisation_id} entityType="INCIDENT" entityId={params.id} initialAttachments={attachments ?? []} canUpload={true} canDelete={true} />
      <DevisSection incidentId={params.id} organisationId={profile.organisation_id} prestataires={(prestataires ?? []) as Prestataire[]} />
      <FactureSection incidentId={params.id} organisationId={profile.organisation_id} />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline logs={activityLogs} />
        </CardContent>
      </Card>
    </div>
  );
}

function SlaBadge({ slaStatus }: { slaStatus: { isOverdue: boolean; hoursElapsed: number; maxHours: number | null } }) {
  if (slaStatus.maxHours === null) return null;

  const elapsed = Math.round(slaStatus.hoursElapsed);
  const max = slaStatus.maxHours;
  const ratio = elapsed / max;

  let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
  let colorClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";

  if (slaStatus.isOverdue) {
    variant = "destructive";
    colorClass = "";
  } else if (ratio >= 0.75) {
    colorClass = "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
  }

  return (
    <Badge variant={variant} className={`text-xs gap-1 ${slaStatus.isOverdue ? "" : colorClass}`}>
      <Clock className="h-3 w-3" />
      Délai: {elapsed}h / {max}h max
    </Badge>
  );
}
