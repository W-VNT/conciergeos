import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LOGEMENT_STATUS_LABELS, OFFER_TIER_LABELS } from "@/types/database";
import { deleteLogement } from "@/lib/actions/logements";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { PhotoSection } from "@/components/shared/photo-section";
import { SyncIcalButton } from "@/components/shared/sync-ical-button";

export default async function LogementDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();

  const { data: logement } = await supabase.from("logements").select("*, proprietaire:proprietaires(*)").eq("id", params.id).single();
  if (!logement) notFound();

  const { data: attachments } = await supabase.from("attachments").select("*").eq("entity_type", "LOGEMENT").eq("entity_id", params.id).order("created_at", { ascending: false });
  const { data: missions } = await supabase.from("missions").select("id, type, status, scheduled_at").eq("logement_id", params.id).order("scheduled_at", { ascending: false }).limit(5);
  const { data: incidents } = await supabase.from("incidents").select("id, severity, status, description, opened_at").eq("logement_id", params.id).order("opened_at", { ascending: false }).limit(5);

  const prop = logement.proprietaire as { id: string; full_name: string } | null;

  return (
    <div className="space-y-6">
      <PageHeader title={logement.name} showCreate={false}>
        <SyncIcalButton
          logementId={logement.id}
          hasIcalUrl={!!logement.ical_url}
          lastSyncedAt={logement.ical_last_synced_at}
        />
        {admin && (
          <>
            <Button variant="outline" asChild><Link href={`/logements/${logement.id}/edit`}><Pencil className="h-4 w-4 mr-2" /> Modifier</Link></Button>
            <form action={async () => { "use server"; await deleteLogement(logement.id); }}>
              <Button variant="destructive" size="sm" type="submit"><Trash2 className="h-4 w-4 mr-2" /> Supprimer</Button>
            </form>
          </>
        )}
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Adresse</span><span>{[logement.address_line1, logement.postal_code, logement.city].filter(Boolean).join(", ") || "—"}</span></div>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Accès</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Boîte à clés</span><code className="bg-gray-100 px-2 py-0.5 rounded">{logement.lockbox_code || "—"}</code></div>
            <div className="flex justify-between"><span className="text-muted-foreground">WiFi</span><span>{logement.wifi_name || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Mot de passe WiFi</span><code className="bg-gray-100 px-2 py-0.5 rounded">{logement.wifi_password || "—"}</code></div>
            {logement.notes && <div><span className="text-muted-foreground">Notes</span><p className="mt-1">{logement.notes}</p></div>}
          </CardContent>
        </Card>
      </div>

      <PhotoSection organisationId={profile.organisation_id} entityType="LOGEMENT" entityId={params.id} initialAttachments={attachments ?? []} canUpload={admin} canDelete={admin} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Dernières missions</CardTitle></CardHeader>
          <CardContent>
            {missions && missions.length > 0 ? (
              <div className="space-y-2">{missions.map((m) => (
                <Link key={m.id} href={`/missions/${m.id}`} className="block p-2 rounded border hover:bg-gray-50 text-sm">{m.type} — {m.status} — {new Date(m.scheduled_at).toLocaleDateString("fr-FR")}</Link>
              ))}</div>
            ) : <p className="text-sm text-muted-foreground">Aucune mission</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Derniers incidents</CardTitle></CardHeader>
          <CardContent>
            {incidents && incidents.length > 0 ? (
              <div className="space-y-2">{incidents.map((i) => (
                <Link key={i.id} href={`/incidents/${i.id}`} className="block p-2 rounded border hover:bg-gray-50 text-sm">{i.severity} — {(i.description as string)?.slice(0, 40)}</Link>
              ))}</div>
            ) : <p className="text-sm text-muted-foreground">Aucun incident</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
