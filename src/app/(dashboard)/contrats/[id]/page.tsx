import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CONTRACT_STATUS_LABELS, CONTRACT_TYPE_LABELS, OFFER_TIER_LABELS } from "@/types/database";
import type { Proprietaire, Logement, OfferTierConfig } from "@/types/database";
import { deleteContrat, duplicateContrat } from "@/lib/actions/contrats";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { Pencil, FileText, Copy } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PhotoSection } from "@/components/shared/photo-section";
import { ContratPDFButton } from "@/components/contrats/contrat-pdf-button";
import { SignContratButton } from "@/components/contrats/sign-contrat-button";
import { VersionHistory } from "@/components/contrats/version-history";

export const dynamic = "force-dynamic";

export default async function ContratDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();

  const [{ data: contrat }, { data: org }, { data: attachments }, { data: offerConfigs }] = await Promise.all([
    supabase
      .from("contrats")
      .select("*, proprietaire:proprietaires(*), logement:logements(*)")
      .eq("id", params.id)
      .eq("organisation_id", profile.organisation_id)
      .single(),
    supabase
      .from("organisations")
      .select("*")
      .eq("id", profile.organisation_id)
      .single(),
    supabase
      .from("attachments")
      .select("*")
      .eq("entity_type", "CONTRAT")
      .eq("entity_id", params.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("offer_tier_configs")
      .select("*")
      .eq("organisation_id", profile.organisation_id),
  ]);

  if (!contrat) notFound();

  const prop = contrat.proprietaire as Proprietaire | null;
  const logement = contrat.logement as Logement | null;
  const offerConfig = logement && offerConfigs
    ? (offerConfigs as OfferTierConfig[]).find((c) => c.tier === logement.offer_tier) ?? null
    : null;

  // Calculate days remaining
  const endDate = new Date(contrat.end_date);
  const today = new Date();
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const pdfData = {
    contrat: {
      id: contrat.id,
      type: contrat.type,
      start_date: contrat.start_date,
      end_date: contrat.end_date,
      commission_rate: contrat.commission_rate,
      status: contrat.status,
      conditions: contrat.conditions,
    },
    proprietaire: prop
      ? {
          full_name: prop.full_name,
          address_line1: prop.address_line1,
          postal_code: prop.postal_code,
          city: prop.city,
          statut_juridique: prop.statut_juridique,
          siret: prop.siret,
          email: prop.email,
          phone: prop.phone,
        }
      : null,
    logement: logement
      ? {
          name: logement.name,
          address_line1: logement.address_line1,
          postal_code: logement.postal_code,
          city: logement.city,
        }
      : null,
    organisation: {
      name: org?.name ?? "Conciergerie",
      city: org?.city ?? null,
      address_line1: org?.address_line1 ?? null,
      postal_code: org?.postal_code ?? null,
      siret: org?.siret ?? null,
      phone: org?.phone ?? null,
      email: org?.email ?? null,
      statut_juridique: org?.statut_juridique ?? null,
    },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Contrat — ${prop?.full_name ?? "Sans propriétaire"}`}
        showCreate={false}
        showBack={true}
        backHref="/contrats"
        entityName={`Contrat ${CONTRACT_TYPE_LABELS[contrat.type as keyof typeof CONTRACT_TYPE_LABELS]}`}
      >
        <ContratPDFButton data={pdfData} />
        {admin && (
          <form
            action={async () => {
              "use server";
              const result = await duplicateContrat(contrat.id);
              if (result.success && result.data?.id) redirect(`/contrats/${result.data.id}`);
            }}
          >
            <Button variant="outline" size="sm" type="submit">
              <Copy className="h-4 w-4 mr-2" /> Renouveler
            </Button>
          </form>
        )}
        {admin && contrat.status !== "SIGNE" && (
          <>
            <SignContratButton contratId={contrat.id} />
            <Button variant="outline" asChild>
              <Link href={`/contrats/${contrat.id}/edit`}>
                <Pencil className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Modifier</span>
              </Link>
            </Button>
            <DeleteConfirmDialog
              entityType="contrat"
              entityName={`Contrat ${contrat.type}`}
              deleteAction={async () => {
                "use server";
                return await deleteContrat(contrat.id);
              }}
              redirectPath="/contrats"
            />
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
            <div className="flex justify-between items-baseline">
              <span className="text-muted-foreground">Commission</span>
              <div className="text-right">
                <span className="font-semibold text-lg">{contrat.commission_rate}%</span>
                {offerConfig && offerConfig.commission_rate !== contrat.commission_rate && (
                  <p className="text-xs text-muted-foreground">
                    Tarif standard {offerConfig.commission_rate}% · taux négocié
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offre associée */}
      {offerConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Offre associée</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Niveau</span>
              <StatusBadge
                value={offerConfig.tier}
                label={OFFER_TIER_LABELS[offerConfig.tier]}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nom</span>
              <span className="font-medium">{offerConfig.name}</span>
            </div>
            {offerConfig.description && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">Description</span>
                <span className="text-right">{offerConfig.description}</span>
              </div>
            )}
            {offerConfig.services && offerConfig.services.length > 0 && (
              <div>
                <span className="text-muted-foreground block mb-2">Services inclus</span>
                <ul className="space-y-1">
                  {offerConfig.services.map((service: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {service}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
        title="Documents annexes"
      />

      <VersionHistory contratId={params.id} />

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
          {contrat.pdf_downloaded_at && (
            <div className="flex justify-between">
              <span>PDF téléchargé le</span>
              <span>{new Date(contrat.pdf_downloaded_at).toLocaleString("fr-FR")}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
