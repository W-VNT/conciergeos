import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MISSION_TYPE_LABELS, MISSION_STATUS_LABELS, MISSION_PRIORITY_LABELS, EQUIPEMENT_ETAT_LABELS } from "@/types/database";
import { deleteMission } from "@/lib/actions/missions";
import { CompleteMissionButton } from "@/components/shared/complete-mission-button";
import { Pencil, Trash2, AlertTriangle, KeyRound, MapPin, Users, CalendarClock, CheckCircle2, Clock, Wifi, Package, ChevronDown } from "lucide-react";
import Link from "next/link";
import { ChecklistManager } from "@/components/missions/checklist-manager";

export default async function MissionDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();

  const { data: mission } = await supabase
    .from("missions")
    .select("*, logement:logements(id, name, address_line1, city, lockbox_code, wifi_name, wifi_password, bedrooms, beds, menage_price, notes), assignee:profiles(id, full_name)")
    .eq("id", params.id)
    .single();

  if (!mission) notFound();

  const [
    { data: reservation },
    { data: nextReservation },
    { data: prevReservation },
    { data: checkoutMission },
    { data: lingeEquipements },
    { data: checkinMission },
    { data: menageMission },
  ] = await Promise.all([
    // Voyageur (check-in et check-out)
    mission.reservation_id && (mission.type === "CHECKIN" || mission.type === "CHECKOUT")
      ? supabase.from("reservations").select("id, guest_name, guest_phone, guest_count, access_instructions, check_out_date, check_out_time").eq("id", mission.reservation_id).single()
      : Promise.resolve({ data: null }),
    // Prochain check-in (ménage)
    mission.type === "MENAGE" && mission.logement_id
      ? supabase
          .from("reservations")
          .select("id, check_in_date, check_in_time, guest_count")
          .eq("logement_id", mission.logement_id)
          .eq("status", "CONFIRMEE")
          .gt("check_in_date", mission.scheduled_at.split("T")[0])
          .order("check_in_date", { ascending: true })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    // Réservation précédente (ménage)
    mission.reservation_id && mission.type === "MENAGE"
      ? supabase.from("reservations").select("id, guest_name, guest_count, check_out_date").eq("id", mission.reservation_id).single()
      : Promise.resolve({ data: null }),
    // Statut du checkout lié à la même réservation (ménage)
    mission.reservation_id && mission.type === "MENAGE"
      ? supabase
          .from("missions")
          .select("id, status")
          .eq("reservation_id", mission.reservation_id)
          .eq("type", "CHECKOUT")
          .maybeSingle()
      : Promise.resolve({ data: null }),
    // Matériel à apporter (linge + consommables) pour le ménage
    mission.type === "MENAGE" && mission.logement_id
      ? supabase
          .from("equipements")
          .select("id, nom, quantite, etat, categorie")
          .eq("logement_id", mission.logement_id)
          .in("categorie", ["LINGE", "CONSOMMABLE"])
          .order("categorie")
          .order("nom")
      : Promise.resolve({ data: null }),
    // Statut du check-in lié (checkout) — voyageur encore présent ?
    mission.reservation_id && mission.type === "CHECKOUT"
      ? supabase.from("missions").select("id, status").eq("reservation_id", mission.reservation_id).eq("type", "CHECKIN").maybeSingle()
      : Promise.resolve({ data: null }),
    // Mission ménage liée (checkout) — urgence après départ
    mission.reservation_id && mission.type === "CHECKOUT"
      ? supabase.from("missions").select("id, scheduled_at, status").eq("reservation_id", mission.reservation_id).eq("type", "MENAGE").maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const logement = mission.logement as {
    id: string;
    name: string;
    address_line1: string | null;
    city: string | null;
    lockbox_code: string | null;
    wifi_name: string | null;
    wifi_password: string | null;
    bedrooms: number | null;
    beds: number | null;
    menage_price: number | null;
    notes: string | null;
  } | null;
  const assignee = mission.assignee as { id: string; full_name: string } | null;

  // Calcul urgence check-in
  const checkInDate = nextReservation ? new Date(nextReservation.check_in_date) : null;
  const hoursUntilCheckIn = checkInDate
    ? Math.round((checkInDate.getTime() - Date.now()) / (1000 * 60 * 60))
    : null;
  const isUrgent = hoursUntilCheckIn !== null && hoursUntilCheckIn < 24;

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Mission ${MISSION_TYPE_LABELS[mission.type as keyof typeof MISSION_TYPE_LABELS]}`}
        showCreate={false}
        showBack={true}
        backHref="/missions"
      >
        {mission.status !== "TERMINE" && mission.status !== "ANNULE" && <CompleteMissionButton missionId={mission.id} variant="default" />}
        <Button variant="outline" asChild>
          <Link href={`/incidents/new?logement_id=${mission.logement_id}&mission_id=${mission.id}`}><AlertTriangle className="h-4 w-4 mr-2" /> Créer incident</Link>
        </Button>
        <Button variant="outline" asChild><Link href={`/missions/${mission.id}/edit`}><Pencil className="h-4 w-4 mr-2" /> Modifier</Link></Button>
        {admin && (
          <form action={async () => { "use server"; await deleteMission(mission.id); }}>
            <Button variant="destructive" size="sm" type="submit"><Trash2 className="h-4 w-4 mr-2" /> Supprimer</Button>
          </form>
        )}
      </PageHeader>

      {mission.type === "MENAGE" ? (
        <>
          {/* ── 1. ACCÈS ─────────────────────────────────────── */}
          <Card>
            <CardContent className="pt-5 space-y-4">
              {logement && (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link href={`/logements/${logement.id}`} className="font-semibold text-lg hover:underline leading-tight">
                      {logement.name}
                    </Link>
                    {(logement.address_line1 || logement.city) && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        {[logement.address_line1, logement.city].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium">{new Date(mission.scheduled_at).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}</p>
                    <p className="text-xs text-muted-foreground">{new Date(mission.scheduled_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              )}

              {/* Code boîte à clés — très visible */}
              {logement?.lockbox_code && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <p className="text-xs font-medium text-amber-700 flex items-center gap-1 mb-1.5">
                    <KeyRound className="h-3.5 w-3.5" /> Code boîte à clés
                  </p>
                  <code className="font-mono text-3xl font-bold tracking-widest text-amber-900">
                    {logement.lockbox_code}
                  </code>
                </div>
              )}

              {/* WiFi — discret */}
              {logement?.wifi_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wifi className="h-4 w-4 flex-shrink-0" />
                  <span>{logement.wifi_name}</span>
                  {logement.wifi_password && (
                    <code className="bg-gray-100 px-2 py-0.5 rounded text-xs ml-1">{logement.wifi_password}</code>
                  )}
                </div>
              )}

              {logement?.notes && (
                <div className="text-sm border-t pt-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notes logement</p>
                  <p className="whitespace-pre-wrap">{logement.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── 2. TIMING ────────────────────────────────────── */}
          <div className="space-y-2">
            {/* Statut checkout */}
            {checkoutMission && checkoutMission.status !== "TERMINE" && (
              <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>Check-out pas encore effectué — vérifiez que le logement est libéré avant de commencer</span>
              </div>
            )}
            {checkoutMission?.status === "TERMINE" && (
              <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>Check-out effectué — le logement est libre</span>
              </div>
            )}

            {/* Prochain check-in */}
            {checkInDate ? (
              <div className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm ${
                isUrgent
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-blue-50 border-blue-200 text-blue-700"
              }`}>
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 flex-shrink-0" />
                  <span>Prochain check-in</span>
                </div>
                <span className="font-semibold tabular-nums">
                  {checkInDate.toLocaleDateString("fr-FR")}{nextReservation?.check_in_time ? ` à ${nextReservation.check_in_time.slice(0, 5)}` : ""}
                  {isUrgent && hoursUntilCheckIn !== null && ` — ${hoursUntilCheckIn}h`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border rounded-lg text-sm text-muted-foreground">
                <CalendarClock className="h-4 w-4 flex-shrink-0" />
                <span>Aucun prochain check-in programmé</span>
              </div>
            )}
          </div>

          {/* ── 3. À APPORTER ────────────────────────────────── */}
          {((lingeEquipements && lingeEquipements.length > 0) || logement?.beds) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" /> À apporter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                {logement?.beds && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lits à préparer</span>
                    <span className="font-medium">{logement.beds} lit{logement.beds > 1 ? "s" : ""}</span>
                  </div>
                )}
                {lingeEquipements?.map((eq) => (
                  <div key={eq.id} className="flex justify-between items-center">
                    <span>{eq.nom}</span>
                    <span className="text-muted-foreground tabular-nums">
                      ×{eq.quantite}
                      {eq.etat !== "BON" && (
                        <span className={`ml-2 text-xs ${eq.etat === "A_REMPLACER" ? "text-destructive" : "text-orange-500"}`}>
                          ({EQUIPEMENT_ETAT_LABELS[eq.etat as keyof typeof EQUIPEMENT_ETAT_LABELS]})
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ── 4. CHECKLIST ─────────────────────────────────── */}
          <ChecklistManager missionId={params.id} />

          {/* ── 5. DÉTAILS ADMIN (collapsible) ───────────────── */}
          <details className="group">
            <summary className="cursor-pointer select-none text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 list-none py-1">
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              Informations de la mission
            </summary>
            <Card className="mt-3">
              <CardContent className="pt-4 space-y-3 text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge value={mission.status} label={MISSION_STATUS_LABELS[mission.status as keyof typeof MISSION_STATUS_LABELS]} />
                  <StatusBadge value={mission.priority} label={MISSION_PRIORITY_LABELS[mission.priority as keyof typeof MISSION_PRIORITY_LABELS]} />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <span className="text-muted-foreground">Assigné à</span>
                  <span className="text-right">{assignee?.full_name ?? "Non assigné"}</span>
                  {mission.completed_at && (
                    <>
                      <span className="text-muted-foreground">Terminé le</span>
                      <span className="text-right">{new Date(mission.completed_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </>
                  )}
                  {mission.time_spent_minutes && (
                    <>
                      <span className="text-muted-foreground">Temps passé</span>
                      <span className="text-right">{mission.time_spent_minutes} min</span>
                    </>
                  )}
                  {logement?.menage_price && (
                    <>
                      <span className="text-muted-foreground">Prix ménage</span>
                      <span className="text-right font-medium">{logement.menage_price} €</span>
                    </>
                  )}
                </div>
                {mission.notes && (
                  <div className="border-t pt-3">
                    <p className="text-muted-foreground mb-1">Notes</p>
                    <p className="whitespace-pre-wrap">{mission.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </details>
        </>
      ) : mission.type === "CHECKOUT" ? (
        <>
          {/* ── 1. ACCÈS ─────────────────────────────────────── */}
          <Card>
            <CardContent className="pt-5 space-y-4">
              {logement && (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link href={`/logements/${logement.id}`} className="font-semibold text-lg hover:underline leading-tight">
                      {logement.name}
                    </Link>
                    {(logement.address_line1 || logement.city) && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        {[logement.address_line1, logement.city].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  {reservation?.check_out_date && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium">
                        {new Date(reservation.check_out_date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}
                      </p>
                      {reservation.check_out_time && (
                        <p className="text-xs text-muted-foreground">{String(reservation.check_out_time).slice(0, 5)}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Code boîte à clés */}
              {logement?.lockbox_code && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <p className="text-xs font-medium text-amber-700 flex items-center gap-1 mb-1.5">
                    <KeyRound className="h-3.5 w-3.5" /> Code boîte à clés
                  </p>
                  <code className="font-mono text-3xl font-bold tracking-widest text-amber-900">
                    {logement.lockbox_code}
                  </code>
                </div>
              )}

              {/* Voyageur */}
              {reservation && (
                <div className="flex items-center justify-between border-t pt-3 text-sm gap-4">
                  <div>
                    <Link href={`/reservations/${reservation.id}`} className="font-medium hover:underline">
                      {reservation.guest_name}
                    </Link>
                    <p className="text-muted-foreground">{reservation.guest_count} voyageur{(reservation.guest_count ?? 1) > 1 ? "s" : ""}</p>
                  </div>
                  {reservation.guest_phone && (
                    <a href={`tel:${reservation.guest_phone}`} className="text-primary font-medium tabular-nums hover:underline flex-shrink-0">
                      {reservation.guest_phone}
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── 2. TIMING ────────────────────────────────────── */}
          <div className="space-y-2">
            {checkinMission && checkinMission.status !== "TERMINE" && (
              <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>Check-in pas encore effectué — le voyageur est peut-être encore présent</span>
              </div>
            )}
            {menageMission && (
              <div className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm ${
                menageMission.status === "TERMINE"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-blue-50 border-blue-200 text-blue-700"
              }`}>
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 flex-shrink-0" />
                  <span>Ménage prévu</span>
                </div>
                <span className="font-semibold tabular-nums">
                  {new Date(menageMission.scheduled_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} à {new Date(menageMission.scheduled_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}
          </div>

          {/* ── 3. CHECKLIST ─────────────────────────────────── */}
          <ChecklistManager missionId={params.id} />

          {/* ── 4. DÉTAILS ADMIN (collapsible) ───────────────── */}
          <details className="group">
            <summary className="cursor-pointer select-none text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 list-none py-1">
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              Informations de la mission
            </summary>
            <Card className="mt-3">
              <CardContent className="pt-4 space-y-3 text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge value={mission.status} label={MISSION_STATUS_LABELS[mission.status as keyof typeof MISSION_STATUS_LABELS]} />
                  <StatusBadge value={mission.priority} label={MISSION_PRIORITY_LABELS[mission.priority as keyof typeof MISSION_PRIORITY_LABELS]} />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <span className="text-muted-foreground">Assigné à</span>
                  <span className="text-right">{assignee?.full_name ?? "Non assigné"}</span>
                  {mission.completed_at && (
                    <>
                      <span className="text-muted-foreground">Terminé le</span>
                      <span className="text-right">{new Date(mission.completed_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </>
                  )}
                  {mission.time_spent_minutes && (
                    <>
                      <span className="text-muted-foreground">Temps passé</span>
                      <span className="text-right">{mission.time_spent_minutes} min</span>
                    </>
                  )}
                </div>
                {mission.notes && (
                  <div className="border-t pt-3">
                    <p className="text-muted-foreground mb-1">Notes</p>
                    <p className="whitespace-pre-wrap">{mission.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </details>
        </>
      ) : (
        <>
          {/* ── AUTRES TYPES DE MISSIONS ─────────────────────── */}
          <Card>
            <CardContent className="pt-5 space-y-4 text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge value={mission.status} label={MISSION_STATUS_LABELS[mission.status as keyof typeof MISSION_STATUS_LABELS]} />
                <StatusBadge value={mission.priority} label={MISSION_PRIORITY_LABELS[mission.priority as keyof typeof MISSION_PRIORITY_LABELS]} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {logement && (
                  <>
                    <span className="text-muted-foreground">Logement</span>
                    <Link href={`/logements/${logement.id}`} className="hover:underline text-right">{logement.name}</Link>
                  </>
                )}
                <span className="text-muted-foreground">Assigné à</span>
                <span className="text-right">{assignee?.full_name ?? "Non assigné"}</span>
                <span className="text-muted-foreground">Planifié le</span>
                <span className="text-right">{new Date(mission.scheduled_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                {mission.completed_at && (
                  <>
                    <span className="text-muted-foreground">Terminé le</span>
                    <span className="text-right">{new Date(mission.completed_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </>
                )}
                {mission.time_spent_minutes && (
                  <>
                    <span className="text-muted-foreground">Temps passé</span>
                    <span className="text-right">{mission.time_spent_minutes} min</span>
                  </>
                )}
              </div>
              {logement && (logement.address_line1 || logement.city || logement.lockbox_code || logement.wifi_name) && (
                <div className="pt-3 border-t space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <KeyRound className="h-3.5 w-3.5" /> Accès
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {(logement.address_line1 || logement.city) && (
                      <>
                        <span className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Adresse</span>
                        <span className="text-right">{[logement.address_line1, logement.city].filter(Boolean).join(", ")}</span>
                      </>
                    )}
                    {logement.lockbox_code && (
                      <>
                        <span className="text-muted-foreground">Boîte à clés</span>
                        <code className="bg-gray-100 px-2 py-0.5 rounded text-right block">{logement.lockbox_code}</code>
                      </>
                    )}
                    {logement.wifi_name && (
                      <>
                        <span className="text-muted-foreground">WiFi</span>
                        <span className="text-right">{logement.wifi_name}</span>
                      </>
                    )}
                    {logement.wifi_password && (
                      <>
                        <span className="text-muted-foreground">Mot de passe</span>
                        <code className="bg-gray-100 px-2 py-0.5 rounded text-right block">{logement.wifi_password}</code>
                      </>
                    )}
                  </div>
                </div>
              )}
              {mission.notes && (
                <div className="pt-1 border-t">
                  <p className="text-muted-foreground mb-1">Notes</p>
                  <p className="whitespace-pre-wrap">{mission.notes}</p>
                </div>
              )}
              {logement?.notes && (
                <div className="pt-1 border-t">
                  <p className="text-muted-foreground mb-1">Notes logement</p>
                  <p className="whitespace-pre-wrap">{logement.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Voyageur — CHECKIN only */}
          {mission.type === "CHECKIN" && reservation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Voyageur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nom</span>
                  <Link href={`/reservations/${reservation.id}`} className="font-medium hover:underline text-primary">
                    {reservation.guest_name}
                  </Link>
                </div>
                {reservation.guest_phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Téléphone</span>
                    <span>{reservation.guest_phone}</span>
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

          <ChecklistManager missionId={params.id} />
        </>
      )}
    </div>
  );
}
