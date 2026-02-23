"use client";

import { useState, useMemo } from "react";
import { Map, Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import { MapPin, X } from "lucide-react";
import type { Logement } from "@/types/database";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { LOGEMENT_STATUS_LABELS, OFFER_TIER_LABELS } from "@/types/database";
import { useTheme } from "next-themes";
import "mapbox-gl/dist/mapbox-gl.css";

interface LogementsMapProps {
  logements: Logement[];
}

export function LogementsMap({ logements }: LogementsMapProps) {
  const [popupInfo, setPopupInfo] = useState<Logement | null>(null);
  const { theme, systemTheme } = useTheme();

  // Determine if dark mode is active
  const isDark = theme === "dark" || (theme === "system" && systemTheme === "dark");

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
      logementsWithCoords.reduce((sum, l) => sum + (l.latitude ?? 0), 0) /
      logementsWithCoords.length;
    const avgLng =
      logementsWithCoords.reduce((sum, l) => sum + (l.longitude ?? 0), 0) /
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
        mapStyle={isDark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/streets-v12"}
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
            <div className="cursor-pointer transform hover:scale-110 transition-transform drop-shadow-lg">
              <MapPin
                className={`h-8 w-8 ${
                  logement.status === "ACTIF"
                    ? "text-blue-600 fill-blue-100 dark:text-blue-400 dark:fill-blue-900/50"
                    : logement.status === "PAUSE"
                    ? "text-orange-600 fill-orange-100 dark:text-orange-400 dark:fill-orange-900/50"
                    : "text-gray-600 fill-gray-100 dark:text-gray-400 dark:fill-gray-800/50"
                }`}
                strokeWidth={1.5}
                stroke="currentColor"
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
            closeButton={false}
            closeOnClick={false}
            offset={25}
          >
            <div className="p-3 min-w-[200px]">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Link
                  href={`/logements/${popupInfo.id}`}
                  className="font-semibold text-base hover:underline leading-tight"
                >
                  {popupInfo.name}
                </Link>
                <button
                  onClick={() => setPopupInfo(null)}
                  className="flex-shrink-0 rounded-md p-0.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

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
