"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CompleteMissionButton } from "@/components/shared/complete-mission-button";
import { startMission } from "@/lib/actions/missions";
import { Navigation, AlertTriangle, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  missionId: string;
  missionStatus: string;
  logementId: string | null;
  mapsUrl: string | null;
}

export function MissionStickyBar({ missionId, missionStatus, logementId, mapsUrl }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (missionStatus === "TERMINE" || missionStatus === "ANNULE") {
    return null;
  }

  const handleStart = async () => {
    setLoading(true);
    try {
      await startMission(missionId);
      toast.success("Mission démarrée");
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-[4rem] inset-x-0 z-40 md:hidden bg-white dark:bg-gray-900 border-t shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-4 py-2">
      <div className="flex gap-2">
        {/* Primary action: Start or Complete */}
        {missionStatus === "A_FAIRE" ? (
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
        ) : (
          <CompleteMissionButton missionId={missionId} variant="default" className="flex-1" />
        )}

        {/* Navigate */}
        {mapsUrl && (
          <Button variant="outline" size="sm" asChild className="flex-1">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="h-4 w-4 mr-1.5" />
              Naviguer
            </a>
          </Button>
        )}

        {/* Report incident */}
        <Button variant="outline" size="sm" asChild className="flex-1">
          <Link href={`/incidents/new?logement_id=${logementId}&mission_id=${missionId}`}>
            <AlertTriangle className="h-4 w-4 mr-1.5" />
            Incident
          </Link>
        </Button>
      </div>
    </div>
  );
}
