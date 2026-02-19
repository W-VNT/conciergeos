import { createClient } from "@/lib/supabase/server";
import { Home, MapPin, Users, BedDouble } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LOGEMENT_STATUS_LABELS, OFFER_TIER_LABELS } from "@/types/database";

export default async function OwnerLogementsPage() {
  const supabase = createClient();

  const { data: logements } = await supabase
    .from("logements")
    .select("id, name, address_line1, city, postal_code, status, offer_tier, bedrooms, beds, max_guests")
    .order("name");

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mes logements</h1>
        <p className="text-muted-foreground mt-1">
          {logements?.length ?? 0} logement{(logements?.length ?? 0) !== 1 ? "s" : ""} associé{(logements?.length ?? 0) !== 1 ? "s" : ""} à votre compte
        </p>
      </div>

      {!logements || logements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Home className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">Aucun logement</p>
            <p className="text-sm text-muted-foreground mt-1">
              Vos logements apparaîtront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {logements.map((l) => (
            <Card key={l.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{l.name}</h3>
                    {(l.address_line1 || l.city) && (
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {[l.address_line1, l.city].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      l.status === "ACTIF"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : l.status === "PAUSE"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {LOGEMENT_STATUS_LABELS[l.status as keyof typeof LOGEMENT_STATUS_LABELS]}
                  </span>
                </div>

                {/* Details */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {l.bedrooms != null && (
                    <div className="flex items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5" />
                      <span>{l.bedrooms} ch.</span>
                    </div>
                  )}
                  {l.beds != null && (
                    <div className="flex items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5" />
                      <span>{l.beds} lit{l.beds !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {l.max_guests != null && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{l.max_guests} pers. max</span>
                    </div>
                  )}
                </div>

                {/* Offer tier */}
                <div className="pt-1 border-t">
                  <span className="text-xs text-muted-foreground">
                    Offre :{" "}
                    <span className="font-medium text-foreground">
                      {OFFER_TIER_LABELS[l.offer_tier as keyof typeof OFFER_TIER_LABELS]}
                    </span>
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
