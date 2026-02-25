"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { ShoppingCart, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { acceptBid, rejectBid } from "@/lib/actions/marketplace";
import { formatCurrency } from "@/lib/format-currency";
import { BID_STATUS_LABELS } from "@/types/database";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { MarketplaceBid } from "@/types/database";

interface Props {
  bids: MarketplaceBid[];
  isAdmin: boolean;
}

export function MarketplaceBidsSection({ bids, isAdmin }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleAccept(bidId: string) {
    if (!confirm("Accepter cette offre ? Le prestataire sera assigné automatiquement.")) return;
    startTransition(async () => {
      await acceptBid(bidId);
      router.refresh();
    });
  }

  async function handleReject(bidId: string) {
    startTransition(async () => {
      await rejectBid(bidId);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Offres marketplace ({bids.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bids.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune offre reçue.</p>
        ) : (
          <div className="space-y-3">
            {bids.map((bid: any) => (
              <div key={bid.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{bid.prestataire?.nom || "Prestataire"}</span>
                    <StatusBadge value={bid.status} label={BID_STATUS_LABELS[bid.status as keyof typeof BID_STATUS_LABELS] || bid.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{formatCurrency(bid.proposed_price)}</span>
                    <span>{format(new Date(bid.created_at), "d MMM HH:mm", { locale: fr })}</span>
                  </div>
                  {bid.message && <p className="mt-1 text-xs text-muted-foreground">{bid.message}</p>}
                </div>
                {isAdmin && bid.status === "EN_ATTENTE" && (
                  <div className="flex items-center gap-1 ml-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" disabled={isPending} onClick={() => handleAccept(bid.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" disabled={isPending} onClick={() => handleReject(bid.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
