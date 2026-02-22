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
    <div className="fixed bottom-[5.5rem] inset-x-0 z-40 md:hidden flex justify-center pointer-events-none">
      <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg border pointer-events-auto">
        {/* Primary action: Start or Complete */}
        {missionStatus === "A_FAIRE" ? (
          <Button size="sm" onClick={handleStart} disabled={loading} className="rounded-full h-11 px-4 text-sm font-medium">
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
          <CompleteMissionButton missionId={missionId} variant="default" className="rounded-full h-11 px-4 text-sm font-medium" />
        )}

        {/* Navigate */}
        {mapsUrl && (
          <Button variant="outline" size="sm" asChild className="rounded-full h-11 px-4 text-sm font-medium">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="h-4 w-4 mr-1.5" />
              Naviguer
            </a>
          </Button>
        )}

        {/* Report incident */}
        <Button variant="outline" size="sm" asChild className="rounded-full h-11 px-4 text-sm font-medium">
          <Link href={`/incidents/new?logement_id=${logementId}&mission_id=${missionId}`}>
            <AlertTriangle className="h-4 w-4 mr-1.5" />
            Incident
          </Link>
        </Button>
      </div>
    </div>
  );
}
