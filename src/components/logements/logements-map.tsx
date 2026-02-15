"use client";

import { useState, useMemo } from "react";
import { Map, Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import { MapPin } from "lucide-react";
import type { Logement } from "@/types/database";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { LOGEMENT_STATUS_LABELS, OFFER_TIER_LABELS } from "@/types/database";
import "mapbox-gl/dist/mapbox-gl.css";

interface LogementsMapProps {
  logements: Logement[];
}

export function LogementsMap({ logements }: LogementsMapProps) {
  const [popupInfo, setPopupInfo] = useState<Logement | null>(null);

  // Filter logements with coordinates
  const logementsWithCoords = useMemo(
    () => logements.filter((l) => l.latitude !== null && l.longitude !== null),
    [logements]
  );

  // Calculate center of map (average of all coordinates)
  const center = useMemo(() => {
    if (logementsWithCoords.length === 0) {
      // Default to Nice, France
      return { latitude: 43.7102, longitude: 7.262 };
    }

    const avgLat =
      logementsWithCoords.reduce((sum, l) => sum + (l.latitude || 0), 0) /
      logementsWithCoords.length;
    const avgLng =
      logementsWithCoords.reduce((sum, l) => sum + (l.longitude || 0), 0) /
      logementsWithCoords.length;

    return { latitude: avgLat, longitude: avgLng };
  }, [logementsWithCoords]);

  return (
    <div className="relative h-[calc(100vh-12rem)] rounded-lg overflow-hidden border">
      <Map
        initialViewState={{
          latitude: center.latitude,
          longitude: center.longitude,
          zoom: logementsWithCoords.length === 1 ? 14 : 11,
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />

        {/* Markers */}
        {logementsWithCoords.map((logement) => (
          <Marker
            key={logement.id}
            latitude={logement.latitude!}
            longitude={logement.longitude!}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setPopupInfo(logement);
            }}
          >
            <div className="cursor-pointer transform hover:scale-110 transition-transform">
              <MapPin
                className={`h-8 w-8 ${
                  logement.status === "ACTIF"
                    ? "text-primary fill-primary/20"
                    : logement.status === "PAUSE"
                    ? "text-orange-500 fill-orange-500/20"
                    : "text-gray-400 fill-gray-400/20"
                }`}
              />
            </div>
          </Marker>
        ))}

        {/* Popup */}
        {popupInfo && (
          <Popup
            latitude={popupInfo.latitude!}
            longitude={popupInfo.longitude!}
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            closeOnClick={false}
            offset={25}
          >
            <div className="p-2 min-w-[200px]">
              <Link
                href={`/logements/${popupInfo.id}`}
                className="font-semibold text-base hover:underline block mb-2"
              >
                {popupInfo.name}
              </Link>

              {popupInfo.city && (
                <p className="text-sm text-muted-foreground mb-2">
                  {popupInfo.city}
                </p>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Offre:</span>
                  <StatusBadge
                    value={popupInfo.offer_tier}
                    label={
                      OFFER_TIER_LABELS[
                        popupInfo.offer_tier as keyof typeof OFFER_TIER_LABELS
                      ]
                    }
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Statut:</span>
                  <StatusBadge
                    value={popupInfo.status}
                    label={
                      LOGEMENT_STATUS_LABELS[
                        popupInfo.status as keyof typeof LOGEMENT_STATUS_LABELS
                      ]
                    }
                  />
                </div>
                {popupInfo.max_guests && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Capacité:</span>
                    <span>{popupInfo.max_guests} voyageurs</span>
                  </div>
                )}
              </div>

              <Link
                href={`/logements/${popupInfo.id}`}
                className="text-primary text-sm hover:underline mt-3 block"
              >
                Voir détails →
              </Link>
            </div>
          </Popup>
        )}
      </Map>

      {/* Stats */}
      <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border">
        <p className="text-sm font-medium">
          {logementsWithCoords.length} logement
          {logementsWithCoords.length > 1 ? "s" : ""} sur la carte
        </p>
        {logements.length > logementsWithCoords.length && (
          <p className="text-xs text-muted-foreground mt-1">
            {logements.length - logementsWithCoords.length} sans coordonnées GPS
          </p>
        )}
      </div>
    </div>
  );
}
