import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CONTRACT_STATUS_LABELS, CONTRACT_TYPE_LABELS } from "@/types/database";
import { deleteContrat } from "@/lib/actions/contrats";
import { Pencil, Trash2, FileText } from "lucide-react";
import Link from "next/link";
import { PhotoSection } from "@/components/shared/photo-section";

export default async function ContratDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();

  const { data: contrat } = await supabase
    .from("contrats")
    .select("*, proprietaire:proprietaires(*), logement:logements(*)")
    .eq("id", params.id)
    .single();

  if (!contrat) notFound();

  const { data: attachments } = await supabase
    .from("attachments")
    .select("*")
    .eq("entity_type", "CONTRAT")
    .eq("entity_id", params.id)
    .order("created_at", { ascending: false });

  const prop = contrat.proprietaire as { id: string; full_name: string } | null;
  const logement = contrat.logement as { id: string; name: string } | null;

  // Calculate days remaining
  const endDate = new Date(contrat.end_date);
  const today = new Date();
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Contrat - ${prop?.full_name ?? "Sans propriétaire"}`}
        showCreate={false}
      >
        {admin && (
          <>
            <Button variant="outline" asChild>
              <Link href={`/contrats/${contrat.id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" /> Modifier
              </Link>
            </Button>
            <form
              action={async () => {
                "use server";
                await deleteContrat(contrat.id);
              }}
            >
              <Button variant="destructive" size="sm" type="submit">
                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
              </Button>
            </form>
          </>
        )}
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Propriétaire</span>
              {prop ? (
                <Link href={`/proprietaires/${prop.id}`} className="hover:underline font-medium">
                  {prop.full_name}
                </Link>
              ) : (
                <span>—</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Logement</span>
              {logement ? (
                <Link href={`/logements/${logement.id}`} className="hover:underline text-primary">
                  {logement.name}
                </Link>
              ) : (
                <span className="text-muted-foreground italic">Tous les logements</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <StatusBadge
                value={contrat.type}
                label={CONTRACT_TYPE_LABELS[contrat.type as keyof typeof CONTRACT_TYPE_LABELS]}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Statut</span>
              <StatusBadge
                value={contrat.status}
                label={CONTRACT_STATUS_LABELS[contrat.status as keyof typeof CONTRACT_STATUS_LABELS]}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Période et commission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date de début</span>
              <span className="font-medium">
                {new Date(contrat.start_date).toLocaleDateString("fr-FR")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date de fin</span>
              <span className="font-medium">
                {new Date(contrat.end_date).toLocaleDateString("fr-FR")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durée</span>
              <span>
                {contrat.status === "ACTIF" && daysRemaining > 0
                  ? `${daysRemaining} jours restants`
                  : contrat.status === "EXPIRE"
                  ? "Expiré"
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Commission</span>
              <span className="font-semibold text-lg">{contrat.commission_rate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {contrat.conditions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Conditions particulières
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{contrat.conditions}</p>
          </CardContent>
        </Card>
      )}

      <PhotoSection
        organisationId={profile.organisation_id}
        entityType="CONTRAT"
        entityId={params.id}
        initialAttachments={attachments ?? []}
        canUpload={admin}
        canDelete={admin}
      />

      <Card>
        <CardHeader>
          <CardTitle>Métadonnées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Créé le</span>
            <span>{new Date(contrat.created_at).toLocaleString("fr-FR")}</span>
          </div>
          <div className="flex justify-between">
            <span>Dernière modification</span>
            <span>{new Date(contrat.updated_at).toLocaleString("fr-FR")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
