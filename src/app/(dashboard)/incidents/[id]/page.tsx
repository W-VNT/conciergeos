import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { INCIDENT_SEVERITY_LABELS, INCIDENT_STATUS_LABELS, MISSION_TYPE_LABELS } from "@/types/database";
import { deleteIncident } from "@/lib/actions/incidents";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { PhotoSection } from "@/components/shared/photo-section";
import { UpdateIncidentStatusButton } from "@/components/shared/update-incident-status-button";

export default async function IncidentDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();

  const { data: incident } = await supabase
    .from("incidents")
    .select("*, logement:logements(id, name), prestataire:prestataires(id, full_name), mission:missions(id, type, reservation_id)")
    .eq("id", params.id)
    .single();
  if (!incident) notFound();

  const { data: attachments } = await supabase.from("attachments").select("*").eq("entity_type", "INCIDENT").eq("entity_id", params.id).order("created_at", { ascending: false });

  const logement = incident.logement as { id: string; name: string } | null;
  const prestataire = incident.prestataire as { id: string; full_name: string } | null;
  const mission = incident.mission as { id: string; type: string; reservation_id: string | null } | null;

  // Fetch reservation if mission has one
  let reservation: { id: string; guest_name: string } | null = null;
  if (mission?.reservation_id) {
    const { data } = await supabase.from("reservations").select("id, guest_name").eq("id", mission.reservation_id).single();
    reservation = data;
  }

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
          <form action={async () => { "use server"; await deleteIncident(incident.id); }}>
            <Button variant="destructive" size="sm" type="submit"><Trash2 className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Supprimer</span></Button>
          </form>
        )}
      </PageHeader>
      <Card>
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Sévérité</span><StatusBadge value={incident.severity} label={INCIDENT_SEVERITY_LABELS[incident.severity as keyof typeof INCIDENT_SEVERITY_LABELS]} /></div>
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Statut</span><UpdateIncidentStatusButton incidentId={incident.id} currentStatus={incident.status as "OUVERT" | "EN_COURS" | "RESOLU" | "CLOS"} /></div>
          {logement && <div className="flex justify-between"><span className="text-muted-foreground">Logement</span><Link href={`/logements/${logement.id}`} className="hover:underline">{logement.name}</Link></div>}
          {mission && <div className="flex justify-between"><span className="text-muted-foreground">Mission liée</span><Link href={`/missions/${mission.id}`} className="hover:underline">{MISSION_TYPE_LABELS[mission.type as keyof typeof MISSION_TYPE_LABELS] ?? mission.type}</Link></div>}
          {reservation && <div className="flex justify-between"><span className="text-muted-foreground">Réservation</span><Link href={`/reservations/${reservation.id}`} className="hover:underline">{reservation.guest_name}</Link></div>}
          {prestataire && <div className="flex justify-between"><span className="text-muted-foreground">Prestataire</span><Link href={`/prestataires/${prestataire.id}`} className="hover:underline">{prestataire.full_name}</Link></div>}
          <div><span className="text-muted-foreground">Description</span><p className="mt-1">{incident.description}</p></div>
          {incident.cost && <div className="flex justify-between"><span className="text-muted-foreground">Coût</span><span>{Number(incident.cost).toFixed(2)}€</span></div>}
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
      <PhotoSection organisationId={profile.organisation_id} entityType="INCIDENT" entityId={params.id} initialAttachments={attachments ?? []} canUpload={true} canDelete={true} />
    </div>
  );
}
