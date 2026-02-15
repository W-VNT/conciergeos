"use client";

import { Button } from "@/components/ui/button";
import { syncIcal } from "@/lib/actions/ical-sync";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  logementId: string;
  hasIcalUrl: boolean;
  lastSyncedAt: string | null;
}

export function SyncIcalButton({ logementId, hasIcalUrl, lastSyncedAt }: Props) {
  const [syncing, setSyncing] = useState(false);

  if (!hasIcalUrl) {
    return null;
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const result = await syncIcal(logementId);
      toast.success(result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur de synchronisation");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
        <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
        {syncing ? "Synchronisation..." : "Sync iCal"}
      </Button>
      {lastSyncedAt && (
        <span className="text-xs text-muted-foreground">
          Dernière sync: {new Date(lastSyncedAt).toLocaleString("fr-FR")}
        </span>
      )}
    </div>
  );
}
