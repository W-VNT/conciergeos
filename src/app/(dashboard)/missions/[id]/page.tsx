import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MISSION_TYPE_LABELS, MISSION_STATUS_LABELS, MISSION_PRIORITY_LABELS } from "@/types/database";
import { deleteMission } from "@/lib/actions/missions";
import { CompleteMissionButton } from "@/components/shared/complete-mission-button";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { PhotoSection } from "@/components/shared/photo-section";

export default async function MissionDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();

  const { data: mission } = await supabase
    .from("missions")
    .select("*, logement:logements(id, name), assignee:profiles(id, full_name)")
    .eq("id", params.id)
    .single();

  if (!mission) notFound();

  const { data: attachments } = await supabase.from("attachments").select("*").eq("entity_type", "MISSION").eq("entity_id", params.id).order("created_at", { ascending: false });

  const logement = mission.logement as { id: string; name: string } | null;
  const assignee = mission.assignee as { id: string; full_name: string } | null;

  return (
    <div className="space-y-6">
      <PageHeader title={`Mission ${MISSION_TYPE_LABELS[mission.type as keyof typeof MISSION_TYPE_LABELS]}`} showCreate={false}>
        {mission.status !== "TERMINE" && mission.status !== "ANNULE" && <CompleteMissionButton missionId={mission.id} variant="default" />}
        <Button variant="outline" asChild>
          <Link href={`/incidents/new?logement_id=${mission.logement_id}&mission_id=${mission.id}`}><AlertTriangle className="h-4 w-4 mr-2" /> Créer incident</Link>
        </Button>
        <Button variant="outline" asChild><Link href={`/missions/${mission.id}/edit`}><Pencil className="h-4 w-4 mr-2" /> Modifier</Link></Button>
        {admin && (
          <form action={async () => { "use server"; await deleteMission(mission.id); }}>
            <Button variant="destructive" size="sm" type="submit"><Trash2 className="h-4 w-4 mr-2" /> Supprimer</Button>
          </form>
        )}
      </PageHeader>

      <Card>
        <CardHeader><CardTitle>Détails</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Type</span><StatusBadge value={mission.type} label={MISSION_TYPE_LABELS[mission.type as keyof typeof MISSION_TYPE_LABELS]} /></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Statut</span><StatusBadge value={mission.status} label={MISSION_STATUS_LABELS[mission.status as keyof typeof MISSION_STATUS_LABELS]} /></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Priorité</span><StatusBadge value={mission.priority} label={MISSION_PRIORITY_LABELS[mission.priority as keyof typeof MISSION_PRIORITY_LABELS]} /></div>
          {logement && <div className="flex justify-between"><span className="text-muted-foreground">Logement</span><Link href={`/logements/${logement.id}`} className="hover:underline">{logement.name}</Link></div>}
          <div className="flex justify-between"><span className="text-muted-foreground">Assigné à</span><span>{assignee?.full_name ?? "Non assigné"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Planifié le</span><span>{new Date(mission.scheduled_at).toLocaleString("fr-FR")}</span></div>
          {mission.completed_at && <div className="flex justify-between"><span className="text-muted-foreground">Terminé le</span><span>{new Date(mission.completed_at).toLocaleString("fr-FR")}</span></div>}
          {mission.time_spent_minutes && <div className="flex justify-between"><span className="text-muted-foreground">Temps passé</span><span>{mission.time_spent_minutes} min</span></div>}
          {mission.notes && <div><span className="text-muted-foreground">Notes</span><p className="mt-1">{mission.notes}</p></div>}
        </CardContent>
      </Card>

      <PhotoSection organisationId={profile.organisation_id} entityType="MISSION" entityId={params.id} initialAttachments={attachments ?? []} canUpload={true} canDelete={true} />
    </div>
  );
}
