"use client";

import { useState } from "react";
import { completeMission } from "@/lib/actions/missions";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  missionId: string;
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export function CompleteMissionButton({ missionId, variant = "outline", className }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleComplete() {
    setLoading(true);
    try {
      await completeMission(missionId);
      toast.success("Mission marquée terminée");
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} size="sm" className={className} onClick={handleComplete} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <CheckCircle className="h-4 w-4 mr-1" />
          Terminé
        </>
      )}
    </Button>
  );
}
