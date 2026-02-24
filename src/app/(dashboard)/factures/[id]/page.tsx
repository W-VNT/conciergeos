import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getFactureById, validateFacture, markFacturePaid, refuseFacture } from "@/lib/actions/factures-prestataires";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FACTURE_STATUS_LABELS, DEVIS_STATUS_LABELS } from "@/types/database";
import type { FactureStatus, DevisStatus } from "@/types/database";
import { formatCurrency } from "@/lib/format-currency";
import { Check, Banknote, X, ExternalLink } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FactureDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireProfile();
  if (!isAdminOrManager(profile)) redirect("/dashboard");

  const facture = await getFactureById(params.id);
  if (!facture) notFound();

  const prestataire = facture.prestataire as {
    id: string;
    full_name: string;
    phone?: string | null;
    email?: string | null;
    specialty?: string | null;
  } | null;

  const mission = facture.mission as {
    id: string;
    type: string;
    status?: string;
  } | null;

  const incident = facture.incident as {
    id: string;
    description: string;
    status?: string;
    severity?: string;
  } | null;

  const devis = facture.devis as {
    id: string;
    montant: number;
    description: string;
    status?: string;
  } | null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Facture ${facture.numero_facture || `#${facture.id.slice(0, 8)}`}`}
        showCreate={false}
        showBack={true}
        backHref="/factures"
        entityName="Facture"
      >
        {facture.status === "ATTENTE" && (
          <form
            action={async () => {
              "use server";
              await validateFacture(facture.id);
              redirect(`/factures/${facture.id}`);
            }}
          >
            <Button type="submit" variant="outline" size="sm" className="text-blue-600">
              <Check className="h-4 w-4 mr-2" />
              Valider
            </Button>
          </form>
        )}
        {facture.status === "VALIDEE" && (
          <form
            action={async () => {
              "use server";
              await markFacturePaid(facture.id);
              redirect(`/factures/${facture.id}`);
            }}
          >
            <Button type="submit" variant="outline" size="sm" className="text-green-600">
              <Banknote className="h-4 w-4 mr-2" />
              Marquer payée
            </Button>
          </form>
        )}
        {facture.status !== "PAYEE" && facture.status !== "REFUSEE" && (
          <form
            action={async () => {
              "use server";
              await refuseFacture(facture.id);
              redirect(`/factures/${facture.id}`);
            }}
          >
            <Button type="submit" variant="outline" size="sm" className="text-red-600">
              <X className="h-4 w-4 mr-2" />
              Refuser
            </Button>
          </form>
        )}
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations de la facture */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de la facture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">N° Facture</span>
              <span className="font-medium">
                {facture.numero_facture || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Montant</span>
              <span className="font-semibold text-lg">
                {formatCurrency(facture.montant)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Statut</span>
              <StatusBadge
                value={facture.status}
                label={FACTURE_STATUS_LABELS[facture.status as FactureStatus]}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date d&apos;émission</span>
              <span>
                {new Date(facture.date_emission).toLocaleDateString("fr-FR")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date d&apos;échéance</span>
              <span>
                {facture.date_echeance
                  ? new Date(facture.date_echeance).toLocaleDateString("fr-FR")
                  : "—"}
              </span>
            </div>
            {facture.date_paiement && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date de paiement</span>
                <span>
                  {new Date(facture.date_paiement).toLocaleDateString("fr-FR")}
                </span>
              </div>
            )}
            {facture.description && (
              <div>
                <span className="text-muted-foreground">Description</span>
                <p className="mt-1">{facture.description}</p>
              </div>
            )}
            {facture.notes && (
              <div>
                <span className="text-muted-foreground">Notes</span>
                <p className="mt-1">{facture.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prestataire */}
        <Card>
          <CardHeader>
            <CardTitle>Prestataire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {prestataire ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nom</span>
                  <Link
                    href={`/prestataires/${prestataire.id}`}
                    className="font-medium hover:underline flex items-center gap-1"
                  >
                    {prestataire.full_name}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                {prestataire.email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{prestataire.email}</span>
                  </div>
                )}
                {prestataire.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Téléphone</span>
                    <span>{prestataire.phone}</span>
                  </div>
                )}
                {prestataire.specialty && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spécialité</span>
                    <StatusBadge value={prestataire.specialty} label={prestataire.specialty} />
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Aucun prestataire lié</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Éléments liés */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Incident lié */}
        {incident && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Incident lié</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="line-clamp-2">{incident.description}</p>
              {incident.status && (
                <StatusBadge value={incident.status} label={incident.status} />
              )}
              <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                <Link href={`/incidents/${incident.id}`}>
                  Voir l&apos;incident
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Mission liée */}
        {mission && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mission liée</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <StatusBadge value={mission.type} label={mission.type} />
              </div>
              {mission.status && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <StatusBadge value={mission.status} label={mission.status} />
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                <Link href={`/missions/${mission.id}`}>
                  Voir la mission
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Devis lié */}
        {devis && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Devis lié</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant devis</span>
                <span className="font-medium">{formatCurrency(devis.montant)}</span>
              </div>
              <p className="text-muted-foreground line-clamp-2">{devis.description}</p>
              {devis.status && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <StatusBadge
                    value={devis.status}
                    label={DEVIS_STATUS_LABELS[devis.status as DevisStatus] ?? devis.status}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Métadonnées */}
      <Card>
        <CardHeader>
          <CardTitle>Métadonnées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Créée le</span>
            <span>{new Date(facture.created_at).toLocaleString("fr-FR")}</span>
          </div>
          <div className="flex justify-between">
            <span>Dernière modification</span>
            <span>{new Date(facture.updated_at).toLocaleString("fr-FR")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
