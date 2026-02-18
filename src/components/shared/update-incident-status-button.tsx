"use client";

import { useState } from "react";
import { updateIncidentStatus } from "@/lib/actions/incidents";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { INCIDENT_STATUS_LABELS, type IncidentStatus } from "@/types/database";

interface Props {
  incidentId: string;
  currentStatus: IncidentStatus;
}

export function UpdateIncidentStatusButton({ incidentId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<IncidentStatus>(currentStatus);
  const router = useRouter();

  async function handleChange(newStatus: string) {
    setStatus(newStatus as IncidentStatus);
    setLoading(true);
    try {
      await updateIncidentStatus(incidentId, newStatus);
      toast.success("Statut mis à jour");
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Erreur");
      setStatus(currentStatus);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={handleChange} disabled={loading}>
        <SelectTrigger className="w-36 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(INCIDENT_STATUS_LABELS).map(([k, v]) => (
            <SelectItem key={k} value={k}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
  );
}
