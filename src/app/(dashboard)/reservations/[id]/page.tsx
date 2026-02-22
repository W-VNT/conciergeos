import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { RESERVATION_STATUS_LABELS, BOOKING_PLATFORM_LABELS, MISSION_TYPE_LABELS, MISSION_STATUS_LABELS } from "@/types/database";
import { deleteReservation, terminateReservation } from "@/lib/actions/reservations";
import { Pencil, Users, Calendar, Coins, KeyRound, History, CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function ReservationDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();

  const { data: reservation } = await supabase
    .from("reservations")
    .select("*, logement:logements(*)")
    .eq("id", params.id)
    .single();

  if (!reservation) notFound();

  const logement = reservation.logement as { id: string; name: string; city: string | null; lockbox_code: string | null; wifi_name: string | null; wifi_password: string | null } | null;
  const checkIn = new Date(reservation.check_in_date);
  const checkOut = new Date(reservation.check_out_date);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  // Parallel fetches
  const [{ data: missions }, { data: pastReservations }] = await Promise.all([
    supabase
      .from("missions")
      .select("id, type, status, scheduled_at")
      .eq("reservation_id", params.id)
      .order("scheduled_at"),
    reservation.guest_email
      ? supabase
          .from("reservations")
          .select("id, check_in_date, check_out_date, status, logement:logements(name)")
          .eq("guest_email", reservation.guest_email)
          .neq("id", params.id)
          .order("check_in_date", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Réservation - ${reservation.guest_name}`}
        showCreate={false}
        showBack={true}
        backHref="/reservations"
        entityName={reservation.guest_name}
      >
        {admin && (
          <>
            {reservation.status === "CONFIRMEE" && (
              <form
                action={async () => {
                  "use server";
                  await terminateReservation(reservation.id);
                }}
              >
                <Button variant="outline" size="sm" type="submit">
                  <CheckCircle className="h-4 w-4 mr-2" /> Terminer
                </Button>
              </form>
            )}
            <Button variant="outline" asChild>
              <Link href={`/reservations/${reservation.id}/edit`}>
                <Pencil className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Modifier</span>
              </Link>
            </Button>
            <DeleteConfirmDialog
              entityType="réservation"
              entityName={reservation.guest_name}
              deleteAction={async () => {
                "use server";
                return await deleteReservation(reservation.id);
              }}
              redirectPath="/reservations"
            />
          </>
        )}
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Informations voyageur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nom</span>
              <span className="font-medium">{reservation.guest_name}</span>
            </div>
            {reservation.guest_email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <a href={`mailto:${reservation.guest_email}`} className="text-primary hover:underline">{reservation.guest_email}</a>
              </div>
            )}
            {reservation.guest_phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Téléphone</span>
                <a href={`tel:${reservation.guest_phone}`} className="text-primary hover:underline">{reservation.guest_phone}</a>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nb voyageurs</span>
              <span>{reservation.guest_count}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Détails séjour
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Logement</span>
              {logement ? (
                <Link href={`/logements/${logement.id}`} className="text-primary hover:underline">
                  {logement.name}
                </Link>
              ) : (
                <span>—</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Arrivée</span>
              <span className="font-medium">{checkIn.toLocaleDateString("fr-FR")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Départ</span>
              <span className="font-medium">{checkOut.toLocaleDateString("fr-FR")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durée</span>
              <span>{nights} nuit{nights > 1 ? "s" : ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plateforme</span>
              <StatusBadge
                value={reservation.platform}
                label={BOOKING_PLATFORM_LABELS[reservation.platform as keyof typeof BOOKING_PLATFORM_LABELS]}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Statut</span>
              <StatusBadge
                value={reservation.status}
                label={RESERVATION_STATUS_LABELS[reservation.status as keyof typeof RESERVATION_STATUS_LABELS]}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {reservation.amount && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Montant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{reservation.amount}€</p>
            <p className="text-sm text-muted-foreground mt-1">
              Soit {(reservation.amount / nights).toFixed(2)}€ / nuit
            </p>
          </CardContent>
        </Card>
      )}

      {(logement?.lockbox_code || logement?.wifi_name || logement?.wifi_password || reservation.access_instructions) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Accès
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {logement?.lockbox_code && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Boîte à clés</span>
                <code className="bg-muted px-2 py-0.5 rounded">{logement.lockbox_code}</code>
              </div>
            )}
            {logement?.wifi_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">WiFi</span>
                <span>{logement.wifi_name}</span>
              </div>
            )}
            {logement?.wifi_password && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mot de passe WiFi</span>
                <code className="bg-muted px-2 py-0.5 rounded">{logement.wifi_password}</code>
              </div>
            )}
            {reservation.access_instructions && (
              <div>
                <span className="text-muted-foreground">Instructions spécifiques</span>
                <p className="mt-1 whitespace-pre-wrap">{reservation.access_instructions}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {reservation.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{reservation.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Missions associées</CardTitle>
        </CardHeader>
        <CardContent>
          {missions && missions.length > 0 ? (
            <div className="space-y-2">
              {missions.map((m) => (
                <Link
                  key={m.id}
                  href={`/missions/${m.id}`}
                  className="flex justify-between items-center p-3 rounded border hover:bg-muted/50 text-sm"
                >
                  <span className="font-medium">
                    {MISSION_TYPE_LABELS[m.type as keyof typeof MISSION_TYPE_LABELS] ?? m.type}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {new Date(m.scheduled_at).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <StatusBadge
                      value={m.status}
                      label={MISSION_STATUS_LABELS[m.status as keyof typeof MISSION_STATUS_LABELS]}
                    />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune mission associée</p>
          )}
        </CardContent>
      </Card>

      {pastReservations && pastReservations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique voyageur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pastReservations.map((r) => {
                const lg = (r.logement as unknown) as { name: string } | null;
                return (
                  <Link
                    key={r.id}
                    href={`/reservations/${r.id}`}
                    className="flex justify-between items-center p-3 rounded border hover:bg-muted/50 text-sm"
                  >
                    <span className="font-medium">{lg?.name ?? "—"}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        {new Date(r.check_in_date).toLocaleDateString("fr-FR")} →{" "}
                        {new Date(r.check_out_date).toLocaleDateString("fr-FR")}
                      </span>
                      <StatusBadge
                        value={r.status}
                        label={RESERVATION_STATUS_LABELS[r.status as keyof typeof RESERVATION_STATUS_LABELS]}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
