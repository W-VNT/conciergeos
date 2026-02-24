"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { startMission, completeMission } from "@/lib/actions/missions";
import { MapPin, Loader2, Play, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface GpsCheckinButtonProps {
  missionId: string;
  type: "checkin" | "checkout";
  onComplete?: () => void;
}

export function GpsCheckinButton({
  missionId,
  type,
  onComplete,
}: GpsCheckinButtonProps) {
  const [loading, setLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const router = useRouter();

  async function getPosition(): Promise<{ lat: number; lng: number } | null> {
    if (!navigator.geolocation) {
      setGpsError("La geolocalisation n'est pas supportee par votre navigateur");
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsError(null);
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setGpsError("Acces a la localisation refuse");
              break;
            case error.POSITION_UNAVAILABLE:
              setGpsError("Position indisponible");
              break;
            case error.TIMEOUT:
              setGpsError("Delai d'attente depasse");
              break;
            default:
              setGpsError("Erreur de geolocalisation");
          }
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  async function handleClick() {
    setLoading(true);
    setGpsError(null);

    try {
      const coords = await getPosition();

      if (type === "checkin") {
        await startMission(missionId, coords ?? undefined);
        toast.success("Mission demarree" + (coords ? " avec position GPS" : ""));
      } else {
        await completeMission(missionId, coords ?? undefined);
        toast.success("Mission terminee" + (coords ? " avec position GPS" : ""));
      }

      router.refresh();
      onComplete?.();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button
        onClick={handleClick}
        disabled={loading}
        size="sm"
        variant={type === "checkin" ? "default" : "default"}
        className={type === "checkout" ? "bg-green-600 hover:bg-green-700" : ""}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
        ) : (
          <>
            {type === "checkin" ? (
              <Play className="h-4 w-4 mr-1.5" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1.5" />
            )}
            <MapPin className="h-3 w-3 mr-1" />
          </>
        )}
        {loading
          ? "Localisation..."
          : type === "checkin"
          ? "Demarrer avec GPS"
          : "Terminer avec GPS"}
      </Button>
      {gpsError && (
        <p className="text-xs text-destructive">{gpsError}</p>
      )}
    </div>
  );
}
