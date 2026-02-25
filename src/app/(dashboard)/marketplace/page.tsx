import { requireProfile, isAdminOrManager } from "@/lib/auth";
import { getOpenJobs } from "@/lib/actions/marketplace";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MISSION_TYPE_LABELS } from "@/types/database";

export default async function MarketplacePage() {
  const profile = await requireProfile();
  const { missions, incidents } = await getOpenJobs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="h-6 w-6" />Marketplace</h1>
        <p className="text-sm text-muted-foreground">Missions et incidents ouverts aux offres des prestataires</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Missions ouvertes</p><p className="text-2xl font-bold">{missions.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Incidents ouverts</p><p className="text-2xl font-bold">{incidents.length}</p></CardContent></Card>
      </div>

      {missions.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Missions ouvertes aux offres</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {missions.map((m: any) => (
                <Link key={m.id} href={`/missions/${m.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge value={m.type} label={MISSION_TYPE_LABELS[m.type as keyof typeof MISSION_TYPE_LABELS] || m.type} />
                      <span className="text-sm font-medium">{m.logement?.name || "Sans logement"}</span>
                    </div>
                    {m.scheduled_at && <p className="text-xs text-muted-foreground mt-1">{format(new Date(m.scheduled_at), "d MMM yyyy HH:mm", { locale: fr })}</p>}
                  </div>
                  <StatusBadge value={m.status} label={m.status} />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {incidents.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Incidents ouverts aux offres</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {incidents.map((i: any) => (
                <Link key={i.id} href={`/incidents/${i.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge value={i.severity} label={i.severity} />
                      <span className="text-sm font-medium">{i.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{i.logement?.name || "Sans logement"}</p>
                  </div>
                  <StatusBadge value={i.status} label={i.status} />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {missions.length === 0 && incidents.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Aucune mission ou incident ouvert aux offres pour le moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
