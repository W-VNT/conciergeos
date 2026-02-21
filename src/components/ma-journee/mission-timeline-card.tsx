"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { MISSION_TYPE_LABELS, MISSION_STATUS_LABELS, MISSION_PRIORITY_LABELS } from "@/types/database";
import { startMission, completeMission } from "@/lib/actions/missions";
import { Navigation, KeyRound, Wifi, Play, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Logement {
  id: string;
  name: string;
  address_line1: string | null;
  city: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  lockbox_code: string | null;
  wifi_name: string | null;
  wifi_password: string | null;
}

interface Reservation {
  guest_name: string;
  guest_count: number;
  check_in_time: string | null;
  check_out_time: string | null;
}

interface Mission {
  id: string;
  type: string;
  status: string;
  priority: string;
  scheduled_at: string;
  notes: string | null;
  logement?: Logement | Logement[] | null;
  reservation?: Reservation | Reservation[] | null;
}

interface Props {
  mission: Mission;
}

export function MissionTimelineCard({ mission }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const logement = (Array.isArray(mission.logement) ? mission.logement[0] : mission.logement) as Logement | null;
  const reservation = (Array.isArray(mission.reservation) ? mission.reservation[0] : mission.reservation) as Reservation | null;

  const isDone = mission.status === "TERMINE" || mission.status === "ANNULE";

  // Build address text and maps URL
  const addressText = logement
    ? [logement.address_line1, logement.postal_code, logement.city].filter(Boolean).join(", ")
    : null;

  const mapsUrl = logement?.latitude && logement?.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${logement.latitude},${logement.longitude}`
    : addressText
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`
      : null;

  const handleStart = async () => {
    setLoading(true);
    try {
      await startMission(mission.id);
      toast.success("Mission démarrée");
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await completeMission(mission.id);
      toast.success("Mission terminée");
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "border rounded-lg bg-card transition-all",
        isDone && "opacity-50"
      )}
    >
      {/* Header: type + priority + time */}
      <div className="flex items-center gap-2 p-3 pb-0">
        <StatusBadge value={mission.type} label={MISSION_TYPE_LABELS[mission.type as keyof typeof MISSION_TYPE_LABELS]} />
        {mission.priority !== "NORMALE" && (
          <StatusBadge value={mission.priority} label={MISSION_PRIORITY_LABELS[mission.priority as keyof typeof MISSION_PRIORITY_LABELS]} />
        )}
        <span className="ml-auto text-sm font-medium tabular-nums text-muted-foreground">
          {new Date(mission.scheduled_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Body: logement info */}
      <div className="p-3 space-y-1.5">
        {logement && (
          <>
            <Link href={`/missions/${mission.id}`} className="font-semibold text-sm hover:underline block">
              {logement.name}
            </Link>
            {addressText && (
              <p className="text-xs text-muted-foreground">{addressText}</p>
            )}
          </>
        )}

        {/* Lockbox + WiFi */}
        {(logement?.lockbox_code || logement?.wifi_name) && (
          <div className="flex items-center gap-3 flex-wrap text-xs">
            {logement.lockbox_code && (
              <span className="flex items-center gap-1">
                <KeyRound className="h-3 w-3 text-amber-600" />
                <code className="bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-mono font-bold text-amber-900">
                  {logement.lockbox_code}
                </code>
              </span>
            )}
            {logement.wifi_name && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Wifi className="h-3 w-3" />
                {logement.wifi_name}
                {logement.wifi_password && (
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded">{logement.wifi_password}</code>
                )}
              </span>
            )}
          </div>
        )}

        {/* Context based on mission type */}
        {(mission.type === "CHECKIN" || mission.type === "CHECKOUT") && reservation && (
          <p className="text-xs text-muted-foreground">
            {reservation.guest_name} · {reservation.guest_count} voyageur{reservation.guest_count > 1 ? "s" : ""}
          </p>
        )}

        {(mission.type === "INTERVENTION" || mission.type === "URGENCE") && mission.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">{mission.notes}</p>
        )}
      </div>

      {/* Footer: actions */}
      {!isDone && (
        <div className="flex items-center gap-2 p-3 pt-0 border-t mx-3 mb-3 mt-0 pt-3">
          {mapsUrl && (
            <Button variant="outline" size="sm" asChild className="flex-1">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="h-4 w-4 mr-1.5" />
                Naviguer
              </a>
            </Button>
          )}

          {mission.status === "A_FAIRE" && (
            <Button size="sm" onClick={handleStart} disabled={loading} className="flex-1">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1.5" />
                  Démarrer
                </>
              )}
            </Button>
          )}

          {mission.status === "EN_COURS" && (
            <Button size="sm" onClick={handleComplete} disabled={loading} className="flex-1">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Terminer
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Done state */}
      {isDone && (
        <div className="px-3 pb-3">
          <StatusBadge value={mission.status} label={MISSION_STATUS_LABELS[mission.status as keyof typeof MISSION_STATUS_LABELS]} />
        </div>
      )}
    </div>
  );
}
