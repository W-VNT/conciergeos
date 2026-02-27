import { createClient } from "@/lib/supabase/server";
import { requireProfile, isAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MISSION_TYPE_LABELS, MISSION_STATUS_LABELS, MISSION_PRIORITY_LABELS, EQUIPEMENT_ETAT_LABELS } from "@/types/database";
import { formatCurrencyDecimals } from "@/lib/format-currency";
import { deleteMission } from "@/lib/actions/missions";
import { CompleteMissionButton } from "@/components/shared/complete-mission-button";
import { Pencil, AlertTriangle, KeyRound, MapPin, CalendarClock, CheckCircle2, Clock, Wifi, Package, ChevronDown, Navigation } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import Link from "next/link";
import { ChecklistManager } from "@/components/missions/checklist-manager";
import { MissionStickyBar } from "@/components/missions/mission-sticky-bar";
import { LiveTimer } from "@/components/missions/live-timer";
import { PhotoSection } from "@/components/shared/photo-section";
import { CommentsSection } from "@/components/missions/comments-section";
import { checkMissionSla } from "@/lib/actions/sla";
import { Badge } from "@/components/ui/badge";
import type { MissionComment, SlaConfig, MissionType, MissionStatus } from "@/types/database";
import { MissionMap } from "@/components/missions/mission-map";
import { GpsCheckinButton } from "@/components/missions/gps-checkin-button";
import { DependencyChain } from "@/components/missions/dependency-chain";
import { MissionReportSection } from "@/components/missions/mission-report-section";
import { getMissionReport } from "@/lib/actions/mission-reports";
import type { MissionReport } from "@/types/database";

export default async function MissionDetailPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const admin = isAdmin(profile);
  const supabase = createClient();

  // Try with depends_on join first, fallback without if FK doesn't exist yet
  let mission: any = null;
  const baseSelect = "*, logement:logements(id, name, address_line1, city, postal_code, lockbox_code, wifi_name, wifi_password, bedrooms, beds, menage_price, notes, latitude, longitude), assignee:profiles(id, full_name)";

  const { data, error: err1 } = await supabase
    .from("missions")
    .select(`${baseSelect}, depends_on:missions!depends_on_mission_id(id, type, status)`)
    .eq("id", params.id)
    .eq("organisation_id", profile.organisation_id)
    .single();

  if (err1 && err1.message.includes("could not find a relationship")) {
    // FK not yet in DB — query without the join
    const { data: fallback } = await supabase
      .from("missions")
      .select(baseSelect)
      .eq("id", params.id)
      .eq("organisation_id", profile.organisation_id)
      .single();
    mission = fallback;
  } else {
    mission = data;
  }

  if (!mission) notFound();

  const [
    { data: reservation },
    { data: nextReservation },
    { data: prevReservation },
    { data: checkoutMission },
    { data: lingeEquipements },
    { data: checkinMission },
    { data: menageMission },
    { data: checkInMenageMission },
  ] = await Promise.all([
    // Voyageur (check-in et check-out)
    mission.reservation_id && (mission.type === "CHECKIN" || mission.type === "CHECKOUT")
      ? supabase.from("reservations").select("id, guest_name, guest_phone, guest_count, access_instructions, check_in_date, check_in_time, check_out_date, check_out_time").eq("id", mission.reservation_id).single()
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
    // Ménage précédent (check-in) — logement prêt ?
    mission.reservation_id && mission.type === "CHECKIN"
      ? supabase.from("missions").select("id, status").eq("reservation_id", mission.reservation_id).eq("type", "MENAGE").maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Fetch mission photos
  const { data: missionAttachments } = await supabase
    .from("attachments")
    .select("*")
    .eq("entity_type", "MISSION")
    .eq("entity_id", params.id)
    .eq("organisation_id", profile.organisation_id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  // Fetch comments for this mission
  const { data: comments } = await supabase
    .from("mission_comments")
    .select("*, author:profiles(full_name)")
    .eq("mission_id", params.id)
    .eq("organisation_id", profile.organisation_id)
    .order("created_at");

  // Fetch SLA configs for the organisation
  const { data: slaConfigs } = await supabase
    .from("sla_configs")
    .select("*")
    .eq("organisation_id", profile.organisation_id)
    .eq("entity_type", "MISSION");

  // Calculate SLA status
  const slaStatus = await checkMissionSla(
    {
      type: mission.type,
      status: mission.status,
      scheduled_at: mission.scheduled_at,
      completed_at: mission.completed_at,
    },
    (slaConfigs ?? []) as SlaConfig[]
  );

  // Fetch mission report
  const missionReport = await getMissionReport(params.id);

  const logement = mission.logement as {
    id: string;
    name: string;
    address_line1: string | null;
    city: string | null;
    postal_code: string | null;
    lockbox_code: string | null;
    wifi_name: string | null;
    wifi_password: string | null;
    bedrooms: number | null;
    beds: number | null;
    menage_price: number | null;
    notes: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;

  const dependsOn = mission.depends_on as { id: string; type: string; status: string } | null;

  const addressText = logement ? [logement.address_line1, logement.postal_code, logement.city].filter(Boolean).join(", ") : null;
  const mapsUrl = addressText ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}` : null;
  const assignee = mission.assignee as { id: string; full_name: string } | null;

  // Calcul urgence check-in
  const checkInDate = nextReservation ? new Date(nextReservation.check_in_date) : null;
  const hoursUntilCheckIn = checkInDate
    ? Math.round((checkInDate.getTime() - Date.now()) / (1000 * 60 * 60))
    : null;
  const isUrgent = hoursUntilCheckIn !== null && hoursUntilCheckIn < 24;

  return (
    <div className="space-y-4 pb-16 md:pb-0">
      <PageHeader
        title={`Mission ${MISSION_TYPE_LABELS[mission.type as keyof typeof MISSION_TYPE_LABELS]}`}
        showCreate={false}
        showBack={true}
        backHref="/missions"
        entityName={MISSION_TYPE_LABELS[mission.type as keyof typeof MISSION_TYPE_LABELS]}
      />

      {/* Timer en cours / Temps total */}
      {mission.status === "EN_COURS" && mission.started_at && (
        <div className="flex items-center gap-2 -mt-2 mb-1">
          <LiveTimer startedAt={mission.started_at} />
          <span className="text-sm text-muted-foreground">En cours</span>
        </div>
      )}
      {mission.status === "TERMINE" && mission.time_spent_minutes != null && (
        <div className="flex items-center gap-2 -mt-2 mb-1">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-green-50 border border-green-200 px-2.5 py-1">
            <Clock className="h-3.5 w-3.5 text-green-600" />
            <span className="text-sm text-green-700">
              Temps : {Math.floor(mission.time_spent_minutes / 60) > 0
                ? `${Math.floor(mission.time_spent_minutes / 60)}h ${String(mission.time_spent_minutes % 60).padStart(2, "0")}min`
                : `${mission.time_spent_minutes}min`}
            </span>
          </div>
        </div>
      )}

      {/* SLA Indicator */}
      {slaStatus.maxHours !== null && mission.status !== "TERMINE" && mission.status !== "ANNULE" && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm ${
          slaStatus.isOverdue
            ? "bg-red-50 border-red-200 text-red-700"
            : slaStatus.percentElapsed !== null && slaStatus.percentElapsed > 75
              ? "bg-orange-50 border-orange-200 text-orange-700"
              : "bg-green-50 border-green-200 text-green-700"
        }`}>
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">
            Délai : {Math.round(slaStatus.hoursElapsed)}h / {slaStatus.maxHours}h max
          </span>
          {slaStatus.isOverdue && (
            <Badge variant="destructive" className="ml-auto text-xs">
              SLA dépassé (+{slaStatus.hoursOverdue}h)
            </Badge>
          )}
        </div>
      )}

      {/* Desktop: all actions in top bar */}
      <div className="hidden md:flex gap-2 -mt-2 mb-2">
        {mission.status !== "TERMINE" && mission.status !== "ANNULE" && (
          <CompleteMissionButton missionId={mission.id} variant="default" className="flex-1" />
        )}
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link href={`/incidents/new?logement_id=${mission.logement_id}&mission_id=${mission.id}`}><AlertTriangle className="h-4 w-4 mr-1.5" />Incident</Link>
        </Button>
        <Button variant="outline" size="sm" className="px-3" asChild>
          <Link href={`/missions/${mission.id}/edit`} title="Modifier"><Pencil className="h-4 w-4" /></Link>
        </Button>
        {admin && (
          <DeleteConfirmDialog
            entityType="mission"
            entityName={MISSION_TYPE_LABELS[mission.type as keyof typeof MISSION_TYPE_LABELS]}
            deleteAction={async () => {
              "use server";
              return await deleteMission(mission.id);
            }}
            redirectPath="/missions"
          />
        )}
      </div>

      {/* Mobile: only secondary actions in top bar */}
      <div className="flex md:hidden gap-2 -mt-2 mb-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/missions/${mission.id}/edit`}><Pencil className="h-4 w-4 mr-1.5" />Modifier</Link>
        </Button>
        {admin && (
          <DeleteConfirmDialog
            entityType="mission"
            entityName={MISSION_TYPE_LABELS[mission.type as keyof typeof MISSION_TYPE_LABELS]}
            deleteAction={async () => {
              "use server";
              return await deleteMission(mission.id);
            }}
            redirectPath="/missions"
          />
        )}
      </div>

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
                    {addressText && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        {mapsUrl ? (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <Navigation className="h-3.5 w-3.5 flex-shrink-0" />
                            {addressText}
                          </a>
                        ) : (
                          <>
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            {addressText}
                          </>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium">{new Date(mission.scheduled_at).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}</p>
                    <p className="text-xs text-muted-foreground">{new Date(mission.scheduled_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              )}

              {/* Code boîte à clés */}
              {logement?.lockbox_code && (
                <div className="flex items-center gap-2 text-sm">
                  <KeyRound className="h-4 w-4 flex-shrink-0 text-amber-600" />
                  <span className="text-muted-foreground">Boîte à clés</span>
                  <code className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono font-bold text-amber-900 ml-1">{logement.lockbox_code}</code>
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
                      <span className="text-right">{Math.floor(mission.time_spent_minutes / 60) > 0
                        ? `${Math.floor(mission.time_spent_minutes / 60)}h ${String(mission.time_spent_minutes % 60).padStart(2, "0")}min`
                        : `${mission.time_spent_minutes}min`}</span>
                    </>
                  )}
                  {logement?.menage_price && (
                    <>
                      <span className="text-muted-foreground">Prix ménage</span>
                      <span className="text-right font-medium">{formatCurrencyDecimals(logement.menage_price)}</span>
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
      ) : mission.type === "CHECKIN" ? (
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
                    {addressText && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        {mapsUrl ? (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <Navigation className="h-3.5 w-3.5 flex-shrink-0" />
                            {addressText}
                          </a>
                        ) : (
                          <>
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            {addressText}
                          </>
                        )}
                      </p>
                    )}
                  </div>
                  {reservation?.check_in_date && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium">
                        {new Date(reservation.check_in_date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}
                      </p>
                      {reservation.check_in_time && (
                        <p className="text-xs text-muted-foreground">{String(reservation.check_in_time).slice(0, 5)}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Code boîte à clés */}
              {logement?.lockbox_code && (
                <div className="flex items-center gap-2 text-sm">
                  <KeyRound className="h-4 w-4 flex-shrink-0 text-amber-600" />
                  <span className="text-muted-foreground">Boîte à clés</span>
                  <code className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono font-bold text-amber-900 ml-1">{logement.lockbox_code}</code>
                </div>
              )}

              {/* WiFi — à communiquer au voyageur */}
              {logement?.wifi_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wifi className="h-4 w-4 flex-shrink-0" />
                  <span>{logement.wifi_name}</span>
                  {logement.wifi_password && (
                    <code className="bg-muted px-2 py-0.5 rounded text-xs ml-1">{logement.wifi_password}</code>
                  )}
                </div>
              )}

              {/* Voyageur */}
              {reservation && (
                <div className="border-t pt-3 text-sm space-y-1.5">
                  <div className="flex items-center justify-between gap-4">
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
                  {reservation.check_in_date && reservation.check_out_date && (() => {
                    const nights = Math.round((new Date(reservation.check_out_date).getTime() - new Date(reservation.check_in_date).getTime()) / 86400000);
                    return (
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {"Départ "}
                        {new Date(reservation.check_out_date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}
                        {reservation.check_out_time ? ` ${String(reservation.check_out_time).slice(0, 5)}` : ""}
                        {" · "}{nights} nuit{nights > 1 ? "s" : ""}
                      </p>
                    );
                  })()}
                </div>
              )}

              {/* Instructions spécifiques */}
              {reservation?.access_instructions && (
                <div className="border-t pt-3 text-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Instructions spécifiques</p>
                  <p className="whitespace-pre-wrap">{reservation.access_instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes logement */}

          {logement?.notes && (
            <details className="group">
              <summary className="cursor-pointer select-none text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 list-none py-1">
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                Notes logement
              </summary>
              <Card className="mt-3">
                <CardContent className="pt-4 text-sm">
                  <p className="whitespace-pre-wrap">{logement.notes}</p>
                </CardContent>
              </Card>
            </details>
          )}

          {/* ── 2. TIMING ────────────────────────────────────── */}
          <div className="space-y-2">
            {checkInMenageMission && checkInMenageMission.status !== "TERMINE" && (
              <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>Ménage pas encore effectué — vérifiez l'état du logement avant d'accueillir</span>
              </div>
            )}
            {checkInMenageMission?.status === "TERMINE" && (
              <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>Ménage effectué — le logement est prêt</span>
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
                      <span className="text-right">{Math.floor(mission.time_spent_minutes / 60) > 0
                        ? `${Math.floor(mission.time_spent_minutes / 60)}h ${String(mission.time_spent_minutes % 60).padStart(2, "0")}min`
                        : `${mission.time_spent_minutes}min`}</span>
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
                    {addressText && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        {mapsUrl ? (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <Navigation className="h-3.5 w-3.5 flex-shrink-0" />
                            {addressText}
                          </a>
                        ) : (
                          <>
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            {addressText}
                          </>
                        )}
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
                <div className="flex items-center gap-2 text-sm">
                  <KeyRound className="h-4 w-4 flex-shrink-0 text-amber-600" />
                  <span className="text-muted-foreground">Boîte à clés</span>
                  <code className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono font-bold text-amber-900 ml-1">{logement.lockbox_code}</code>
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
                      <span className="text-right">{Math.floor(mission.time_spent_minutes / 60) > 0
                        ? `${Math.floor(mission.time_spent_minutes / 60)}h ${String(mission.time_spent_minutes % 60).padStart(2, "0")}min`
                        : `${mission.time_spent_minutes}min`}</span>
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
                    <span className="text-right">{Math.floor(mission.time_spent_minutes / 60) > 0
                        ? `${Math.floor(mission.time_spent_minutes / 60)}h ${String(mission.time_spent_minutes % 60).padStart(2, "0")}min`
                        : `${mission.time_spent_minutes}min`}</span>
                  </>
                )}
              </div>
              {logement && (logement.address_line1 || logement.city || logement.lockbox_code || logement.wifi_name) && (
                <div className="pt-3 border-t space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <KeyRound className="h-3.5 w-3.5" /> Accès
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {addressText && (
                      <>
                        <span className="text-muted-foreground flex items-center gap-1"><Navigation className="h-3.5 w-3.5" /> Adresse</span>
                        {mapsUrl ? (
                          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-right hover:text-primary transition-colors">
                            {addressText}
                          </a>
                        ) : (
                          <span className="text-right">{addressText}</span>
                        )}
                      </>
                    )}
                    {logement.lockbox_code && (
                      <>
                        <span className="text-muted-foreground">Boîte à clés</span>
                        <code className="bg-muted px-2 py-0.5 rounded text-right block">{logement.lockbox_code}</code>
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
                        <code className="bg-muted px-2 py-0.5 rounded text-right block">{logement.wifi_password}</code>
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

          <ChecklistManager missionId={params.id} />
        </>
      )}

      {/* Dependency Chain */}
      {dependsOn && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Dependance</CardTitle>
          </CardHeader>
          <CardContent>
            <DependencyChain
              currentMission={{
                id: mission.id,
                type: mission.type as MissionType,
                status: mission.status as MissionStatus,
              }}
              dependsOn={{
                id: dependsOn.id,
                type: dependsOn.type as MissionType,
                status: dependsOn.status as MissionStatus,
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* GPS Check-in/Check-out buttons */}
      {mission.status !== "TERMINE" && mission.status !== "ANNULE" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Geolocalisation</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            {mission.status === "A_FAIRE" && (
              <GpsCheckinButton missionId={mission.id} type="checkin" />
            )}
            {mission.status === "EN_COURS" && (
              <GpsCheckinButton missionId={mission.id} type="checkout" />
            )}
          </CardContent>
        </Card>
      )}

      {/* Mission Map (GPS coordinates) */}
      {(mission.check_in_lat || mission.check_out_lat || logement?.latitude) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Carte</CardTitle>
          </CardHeader>
          <CardContent>
            <MissionMap
              checkInLat={mission.check_in_lat}
              checkInLng={mission.check_in_lng}
              checkOutLat={mission.check_out_lat}
              checkOutLng={mission.check_out_lng}
              logementLat={logement?.latitude}
              logementLng={logement?.longitude}
            />
          </CardContent>
        </Card>
      )}

      {/* Rapport de mission */}
      <MissionReportSection
        missionId={params.id}
        report={missionReport as MissionReport | null}
        isAdmin={admin}
      />

      {/* Commentaires */}
      <CommentsSection
        missionId={params.id}
        initialComments={(comments ?? []) as MissionComment[]}
        currentUserName={profile.full_name}
      />

      {/* Photos de la mission */}
      <PhotoSection
        organisationId={profile.organisation_id}
        entityType="MISSION"
        entityId={params.id}
        initialAttachments={missionAttachments ?? []}
        canUpload={true}
        canDelete={admin}
        title="Photos de la mission"
      />

      {/* Mobile sticky action bar */}
      <MissionStickyBar
        missionId={mission.id}
        missionStatus={mission.status}
        logementId={mission.logement_id}
        mapsUrl={mapsUrl}
      />
    </div>
  );
}
