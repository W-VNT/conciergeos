import { createClient } from "@/lib/supabase/server";
import { CalendarDays, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RESERVATION_STATUS_LABELS, BOOKING_PLATFORM_LABELS } from "@/types/database";

export default async function OwnerReservationsPage() {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: reservations } = await supabase
    .from("reservations")
    .select(
      "id, guest_name, guest_count, check_in_date, check_out_date, platform, status, logement:logements(name)"
    )
    .order("check_in_date", { ascending: false })
    .limit(50);

  const upcoming = reservations?.filter(
    (r) => r.check_in_date >= today && r.status === "CONFIRMEE"
  ) ?? [];
  const current = reservations?.filter(
    (r) => r.check_in_date <= today && r.check_out_date >= today && r.status === "CONFIRMEE"
  ) ?? [];
  const past = reservations?.filter(
    (r) => r.check_out_date < today || r.status !== "CONFIRMEE"
  ) ?? [];

  function statusBadge(status: string) {
    if (status === "CONFIRMEE")
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (status === "ANNULEE")
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }

  function ReservationRow({ r }: { r: NonNullable<typeof reservations>[number] }) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-white dark:bg-gray-900">
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium text-sm truncate">{r.guest_name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {(r.logement as any)?.name}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3 flex-shrink-0" />
            <span>
              {new Date(r.check_in_date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}{" "}
              →{" "}
              {new Date(r.check_out_date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
            </span>
            {r.guest_count > 1 && (
              <>
                <span>·</span>
                <Users className="h-3 w-3 flex-shrink-0" />
                <span>{r.guest_count}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(r.status)}`}
          >
            {RESERVATION_STATUS_LABELS[r.status as keyof typeof RESERVATION_STATUS_LABELS]}
          </span>
          <span className="text-xs text-muted-foreground">
            {BOOKING_PLATFORM_LABELS[r.platform as keyof typeof BOOKING_PLATFORM_LABELS]}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Réservations</h1>
        <p className="text-muted-foreground mt-1">
          {reservations?.length ?? 0} réservation{(reservations?.length ?? 0) !== 1 ? "s" : ""} au total
        </p>
      </div>

      {!reservations || reservations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">Aucune réservation</p>
            <p className="text-sm text-muted-foreground mt-1">
              Les réservations de vos logements apparaîtront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {current.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                En cours ({current.length})
              </h2>
              <div className="space-y-2">
                {current.map((r) => (
                  <ReservationRow key={r.id} r={r} />
                ))}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                À venir ({upcoming.length})
              </h2>
              <div className="space-y-2">
                {upcoming.map((r) => (
                  <ReservationRow key={r.id} r={r} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Passées / Annulées ({past.length})
              </h2>
              <div className="space-y-2">
                {past.map((r) => (
                  <ReservationRow key={r.id} r={r} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
