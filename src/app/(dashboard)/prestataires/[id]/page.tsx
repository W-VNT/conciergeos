import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { SPECIALTY_LABELS, STATUT_JURIDIQUE_LABELS, INCIDENT_SEVERITY_LABELS } from "@/types/database";
import { formatCurrency } from "@/lib/format-currency";
import { deletePrestataire } from "@/lib/actions/prestataires";
import { Pencil, Star } from "lucide-react";
import Link from "next/link";

export default async function PrestataireDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();

  const { data: prestataire } = await supabase.from("prestataires").select("*").eq("id", params.id).eq("organisation_id", profile.organisation_id).single();
  if (!prestataire) notFound();

  const { data: incidents } = await supabase.from("incidents").select("id, severity, status, description, opened_at").eq("prestataire_id", prestataire.id).eq("organisation_id", profile.organisation_id).order("opened_at", { ascending: false }).limit(10);

  return (
    <div className="space-y-6">
      <PageHeader
        title={prestataire.full_name}
        showCreate={false}
        showBack={true}
        backHref="/prestataires"
        entityName={prestataire.full_name}
      >
        {admin && (
          <>
            <Button variant="outline" asChild><Link href={`/prestataires/${prestataire.id}/edit`}><Pencil className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Modifier</span></Link></Button>
            <DeleteConfirmDialog
              entityType="prestataire"
              entityName={prestataire.full_name}
              deleteAction={async () => {
                "use server";
                return await deletePrestataire(prestataire.id);
              }}
              redirectPath="/prestataires"
            />
          </>
        )}
      </PageHeader>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Identité</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Statut juridique</span><span>{STATUT_JURIDIQUE_LABELS[prestataire.statut_juridique as keyof typeof STATUT_JURIDIQUE_LABELS] ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Spécialité</span><StatusBadge value={prestataire.specialty} label={SPECIALTY_LABELS[prestataire.specialty as keyof typeof SPECIALTY_LABELS]} /></div>
            {prestataire.siret && <div className="flex justify-between"><span className="text-muted-foreground">SIRET</span><code className="bg-muted px-2 py-0.5 rounded">{prestataire.siret}</code></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Taux horaire</span><span>{prestataire.hourly_rate ? `${formatCurrency(prestataire.hourly_rate)}/h` : "—"}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Fiabilité</span>
              {prestataire.reliability_score ? (
                <div className="flex items-center gap-1">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`h-4 w-4 ${i < prestataire.reliability_score! ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />))}</div>
              ) : <span>—</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contact & Adresse</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Téléphone</span>{prestataire.phone ? <a href={`tel:${prestataire.phone}`} className="text-primary hover:underline">{prestataire.phone}</a> : <span>—</span>}</div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span>{prestataire.email ? <a href={`mailto:${prestataire.email}`} className="text-primary hover:underline">{prestataire.email}</a> : <span>—</span>}</div>
            {(prestataire.address_line1 || prestataire.city) && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">Adresse</span>
                <span className="text-right">{[prestataire.address_line1, prestataire.postal_code, prestataire.city].filter(Boolean).join(", ")}</span>
              </div>
            )}
            {prestataire.notes && <div><span className="text-muted-foreground block mb-1">Notes</span><p>{prestataire.notes}</p></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Incidents assignés</CardTitle></CardHeader>
          <CardContent>
            {incidents && incidents.length > 0 ? (
              <div className="space-y-2">{incidents.map((i) => (
                <Link key={i.id} href={`/incidents/${i.id}`} className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50 text-sm">
                  <StatusBadge value={i.severity} label={INCIDENT_SEVERITY_LABELS[i.severity as keyof typeof INCIDENT_SEVERITY_LABELS]} />
                  <span className="truncate">{(i.description as string)?.slice(0, 40)}</span>
                </Link>
              ))}</div>
            ) : <p className="text-sm text-muted-foreground">Aucun incident</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
