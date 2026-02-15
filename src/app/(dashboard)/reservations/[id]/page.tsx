import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RESERVATION_STATUS_LABELS, BOOKING_PLATFORM_LABELS } from "@/types/database";
import { deleteReservation } from "@/lib/actions/reservations";
import { Pencil, Trash2, Users, Calendar, Coins } from "lucide-react";
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

  const logement = reservation.logement as { id: string; name: string; city: string | null } | null;

  const checkIn = new Date(reservation.check_in_date);
  const checkOut = new Date(reservation.check_out_date);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  // Get related missions
  const { data: missions } = await supabase
    .from("missions")
    .select("id, type, status, scheduled_at")
    .eq("logement_id", reservation.logement_id)
    .gte("scheduled_at", reservation.check_in_date)
    .lte("scheduled_at", reservation.check_out_date)
    .order("scheduled_at");

  return (
    <div className="space-y-6">
      <PageHeader title={`Réservation - ${reservation.guest_name}`} showCreate={false}>
        {admin && (
          <>
            <Button variant="outline" asChild>
              <Link href={`/reservations/${reservation.id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" /> Modifier
              </Link>
            </Button>
            <form
              action={async () => {
                "use server";
                await deleteReservation(reservation.id);
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
                <span>{reservation.guest_email}</span>
              </div>
            )}
            {reservation.guest_phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Téléphone</span>
                <span>{reservation.guest_phone}</span>
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
              <span>
                {nights} nuit{nights > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plateforme</span>
              <StatusBadge
                value={reservation.platform}
                label={
                  BOOKING_PLATFORM_LABELS[
                    reservation.platform as keyof typeof BOOKING_PLATFORM_LABELS
                  ]
                }
              />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Statut</span>
              <StatusBadge
                value={reservation.status}
                label={
                  RESERVATION_STATUS_LABELS[
                    reservation.status as keyof typeof RESERVATION_STATUS_LABELS
                  ]
                }
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

      {missions && missions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Missions associées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {missions.map((m) => (
                <Link
                  key={m.id}
                  href={`/missions/${m.id}`}
                  className="block p-3 rounded border hover:bg-gray-50 text-sm"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{m.type}</span>
                    <span className="text-muted-foreground">
                      {new Date(m.scheduled_at).toLocaleString("fr-FR")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
