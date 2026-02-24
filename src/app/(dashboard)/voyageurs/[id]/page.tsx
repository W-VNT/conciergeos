import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { deleteVoyageur } from "@/lib/actions/voyageurs";
import { RESERVATION_STATUS_LABELS } from "@/types/database";
import { formatCurrency } from "@/lib/format-currency";
import { User, Mail, Phone, Globe, Flag, Star, Hotel, Coins, Tag, FileText } from "lucide-react";
import Link from "next/link";
import { VoyageurEditDialog } from "@/components/voyageurs/voyageur-edit-dialog";

export default async function VoyageurDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const canManage = isAdminOrManager(profile);
  const supabase = createClient();

  const { data: voyageur } = await supabase
    .from("voyageurs")
    .select("*")
    .eq("id", params.id)
    .eq("organisation_id", profile.organisation_id)
    .single();

  if (!voyageur) notFound();

  // Fetch stay history (reservations linked to this voyageur)
  const { data: reservations } = await supabase
    .from("reservations")
    .select("*, logement:logements(id, name, city)")
    .eq("voyageur_id", params.id)
    .eq("organisation_id", profile.organisation_id)
    .order("check_in_date", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title={voyageur.full_name}
        showCreate={false}
        showBack={true}
        backHref="/voyageurs"
        entityName={voyageur.full_name}
      >
        {canManage && (
          <>
            <VoyageurEditDialog voyageur={voyageur} />
            <DeleteConfirmDialog
              entityType="voyageur"
              entityName={voyageur.full_name}
              deleteAction={async () => {
                "use server";
                return await deleteVoyageur(voyageur.id);
              }}
              redirectPath="/voyageurs"
            />
          </>
        )}
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Hotel className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total séjours</p>
                <p className="text-2xl font-bold">{voyageur.total_stays}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Revenu total</p>
                <p className="text-2xl font-bold">
                  {voyageur.total_revenue > 0 ? formatCurrency(voyageur.total_revenue) : "0 \u20AC"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Note moyenne</p>
                <p className="text-2xl font-bold">
                  {voyageur.average_rating != null ? (
                    <span className="inline-flex items-center gap-1">
                      {voyageur.average_rating.toFixed(1)}
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </span>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Voyageur Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nom</span>
              <span className="font-medium">{voyageur.full_name}</span>
            </div>
            {voyageur.email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> Email
                </span>
                <a href={`mailto:${voyageur.email}`} className="text-primary hover:underline">
                  {voyageur.email}
                </a>
              </div>
            )}
            {voyageur.phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> Téléphone
                </span>
                <a href={`tel:${voyageur.phone}`} className="text-primary hover:underline">
                  {voyageur.phone}
                </a>
              </div>
            )}
            {voyageur.language && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" /> Langue
                </span>
                <span>{voyageur.language}</span>
              </div>
            )}
            {voyageur.nationality && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Flag className="h-3.5 w-3.5" /> Nationalité
                </span>
                <span>{voyageur.nationality}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags & Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {voyageur.tags && voyageur.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {voyageur.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun tag</p>
            )}

            {voyageur.notes ? (
              <div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                  <FileText className="h-3.5 w-3.5" /> Notes
                </div>
                <p className="text-sm whitespace-pre-wrap">{voyageur.notes}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune note</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stay History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5" />
            Historique des séjours
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reservations && reservations.length > 0 ? (
            <div className="space-y-2">
              {reservations.map((r) => {
                const logement = r.logement as { id: string; name: string; city: string | null } | null;
                return (
                  <Link
                    key={r.id}
                    href={`/reservations/${r.id}`}
                    className="flex justify-between items-center p-3 rounded border hover:bg-muted/50 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="font-medium">{logement?.name ?? "—"}</span>
                      {logement?.city && (
                        <span className="text-muted-foreground ml-1">({logement.city})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-muted-foreground">
                        {new Date(r.check_in_date).toLocaleDateString("fr-FR")} →{" "}
                        {new Date(r.check_out_date).toLocaleDateString("fr-FR")}
                      </span>
                      {r.amount != null && r.amount > 0 && (
                        <span className="text-muted-foreground hidden sm:inline">
                          {formatCurrency(r.amount)}
                        </span>
                      )}
                      <StatusBadge
                        value={r.status}
                        label={RESERVATION_STATUS_LABELS[r.status as keyof typeof RESERVATION_STATUS_LABELS]}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun séjour enregistré</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
