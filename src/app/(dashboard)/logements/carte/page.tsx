import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { LogementsMap } from "@/components/logements/logements-map";
import type { Logement } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, AlertCircle } from "lucide-react";

export const metadata = { title: "Carte des logements" };
export const revalidate = 30;

export default async function LogementsCartePage() {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data: logements } = await supabase
    .from("logements")
    .select("*")
    .eq("organisation_id", profile.organisation_id)
    .order("name");

  const logementsWithCoords = logements?.filter(
    (l) => l.latitude !== null && l.longitude !== null
  );
  const logementsWithoutCoords = logements?.filter(
    (l) => l.latitude === null || l.longitude === null
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader
        title="Carte des logements"
        showCreate={false}
        showBack={true}
        backHref="/logements"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {logementsWithCoords?.length || 0} logement
            {(logementsWithCoords?.length || 0) > 1 ? "s" : ""} géolocalisé
            {(logementsWithCoords?.length || 0) > 1 ? "s" : ""}
          </span>
        </div>
      </PageHeader>

      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
        <Card className="mb-4 border-orange-200 bg-orange-50">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-orange-900">
                Configuration Mapbox manquante
              </p>
              <p className="text-sm text-orange-700 mt-1">
                Ajoutez <code className="bg-orange-100 px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> dans votre fichier <code className="bg-orange-100 px-1 rounded">.env.local</code> pour afficher la carte.
              </p>
              <p className="text-sm text-orange-700 mt-2">
                Obtenez un token gratuit sur{" "}
                <a
                  href="https://www.mapbox.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  mapbox.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <LogementsMap logements={(logements as Logement[]) || []} />

      {logementsWithoutCoords && logementsWithoutCoords.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">
                  {logementsWithoutCoords.length} logement
                  {logementsWithoutCoords.length > 1 ? "s" : ""} sans
                  coordonnées GPS
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ajoutez les coordonnées GPS (latitude, longitude) dans la
                  fiche du logement pour l'afficher sur la carte.
                </p>
                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                  {logementsWithoutCoords.map((l) => (
                    <li key={l.id}>• {l.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
