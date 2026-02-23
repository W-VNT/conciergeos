import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Home, CalendarDays, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { RESERVATION_STATUS_LABELS, LOGEMENT_STATUS_LABELS } from "@/types/database";

export default async function OwnerDashboardPage() {
  const profile = await requireProfile();
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];
  const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Fetch logements (RLS filters by proprietaire_id automatically)
  const { data: logements } = await supabase
    .from("logements")
    .select("id, name, city, status")
    .order("name");

  // Fetch upcoming reservations (check-in in next 7 days or currently ongoing)
  const { data: upcomingReservations } = await supabase
    .from("reservations")
    .select("id, guest_name, check_in_date, check_out_date, status, logement:logements(name)")
    .eq("status", "CONFIRMEE")
    .gte("check_out_date", today)
    .lte("check_in_date", in7days)
    .order("check_in_date")
    .limit(5);

  // Fetch current reservations (ongoing)
  const { data: currentReservations } = await supabase
    .from("reservations")
    .select("id")
    .eq("status", "CONFIRMEE")
    .lte("check_in_date", today)
    .gte("check_out_date", today);

  const logementsActifs = logements?.filter((l) => l.status === "ACTIF").length ?? 0;
  const totalLogements = logements?.length ?? 0;
  const enCours = currentReservations?.length ?? 0;
  const prochains = upcomingReservations?.length ?? 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bonjour, {profile.full_name.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Voici l'état de vos logements
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Home className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalLogements}</p>
                <p className="text-xs text-muted-foreground">Logements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{logementsActifs}</p>
                <p className="text-xs text-muted-foreground">Actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enCours}</p>
                <p className="text-xs text-muted-foreground">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{prochains}</p>
                <p className="text-xs text-muted-foreground">À venir (7j)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Logements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Mes logements</CardTitle>
            <Link href="/owner/logements" className="text-xs text-primary hover:underline">
              Voir tout
            </Link>
          </CardHeader>
          <CardContent>
            {!logements || logements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun logement associé
              </p>
            ) : (
              <div className="space-y-2">
                {logements.slice(0, 4).map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between py-1.5 border-b last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{l.name}</p>
                      {l.city && (
                        <p className="text-xs text-muted-foreground">{l.city}</p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${
                        l.status === "ACTIF"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : l.status === "PAUSE"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {LOGEMENT_STATUS_LABELS[l.status as keyof typeof LOGEMENT_STATUS_LABELS]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prochaines réservations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Prochains check-ins</CardTitle>
            <Link href="/owner/reservations" className="text-xs text-primary hover:underline">
              Voir tout
            </Link>
          </CardHeader>
          <CardContent>
            {!upcomingReservations || upcomingReservations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune réservation à venir
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingReservations.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between py-1.5 border-b last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.guest_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(r.logement as any)?.name} ·{" "}
                        {new Date(r.check_in_date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      →{" "}
                      {new Date(r.check_out_date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
