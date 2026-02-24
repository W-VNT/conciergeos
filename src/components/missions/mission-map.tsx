"use client";

import { useMemo } from "react";
import { Map, Marker, NavigationControl } from "react-map-gl/mapbox";
import { MapPin } from "lucide-react";
import { useTheme } from "next-themes";
import "mapbox-gl/dist/mapbox-gl.css";

interface MissionMapProps {
  checkInLat?: number | null;
  checkInLng?: number | null;
  checkOutLat?: number | null;
  checkOutLng?: number | null;
  logementLat?: number | null;
  logementLng?: number | null;
}

export function MissionMap({
  checkInLat,
  checkInLng,
  checkOutLat,
  checkOutLng,
  logementLat,
  logementLng,
}: MissionMapProps) {
  const { theme, systemTheme } = useTheme();
  const isDark =
    theme === "dark" || (theme === "system" && systemTheme === "dark");

  const hasCheckIn =
    checkInLat !== null &&
    checkInLat !== undefined &&
    checkInLng !== null &&
    checkInLng !== undefined;
  const hasCheckOut =
    checkOutLat !== null &&
    checkOutLat !== undefined &&
    checkOutLng !== null &&
    checkOutLng !== undefined;
  const hasLogement =
    logementLat !== null &&
    logementLat !== undefined &&
    logementLng !== null &&
    logementLng !== undefined;

  const hasAnyCoord = hasCheckIn || hasCheckOut || hasLogement;

  const center = useMemo(() => {
    const points: { lat: number; lng: number }[] = [];
    if (hasCheckIn) points.push({ lat: checkInLat!, lng: checkInLng! });
    if (hasCheckOut) points.push({ lat: checkOutLat!, lng: checkOutLng! });
    if (hasLogement) points.push({ lat: logementLat!, lng: logementLng! });

    if (points.length === 0) {
      return { latitude: 43.7102, longitude: 7.262 }; // Default: Nice
    }

    const avgLat =
      points.reduce((sum, p) => sum + p.lat, 0) / points.length;
    const avgLng =
      points.reduce((sum, p) => sum + p.lng, 0) / points.length;

    return { latitude: avgLat, longitude: avgLng };
  }, [
    hasCheckIn,
    hasCheckOut,
    hasLogement,
    checkInLat,
    checkInLng,
    checkOutLat,
    checkOutLng,
    logementLat,
    logementLng,
  ]);

  if (!hasAnyCoord) return null;

  return (
    <div className="rounded-lg overflow-hidden border h-[200px]">
      <Map
        initialViewState={{
          latitude: center.latitude,
          longitude: center.longitude,
          zoom: 14,
        }}
        mapStyle={
          isDark
            ? "mapbox://styles/mapbox/dark-v11"
            : "mapbox://styles/mapbox/streets-v12"
        }
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* Logement marker - blue */}
        {hasLogement && (
          <Marker latitude={logementLat!} longitude={logementLng!}>
            <div className="drop-shadow-lg" title="Logement">
              <MapPin
                className="h-7 w-7 text-blue-600 fill-blue-100 dark:text-blue-400 dark:fill-blue-900/50"
                strokeWidth={1.5}
              />
            </div>
          </Marker>
        )}

        {/* Check-in marker - green */}
        {hasCheckIn && (
          <Marker latitude={checkInLat!} longitude={checkInLng!}>
            <div className="drop-shadow-lg" title="Check-in">
              <MapPin
                className="h-7 w-7 text-green-600 fill-green-100 dark:text-green-400 dark:fill-green-900/50"
                strokeWidth={1.5}
              />
            </div>
          </Marker>
        )}

        {/* Check-out marker - red */}
        {hasCheckOut && (
          <Marker latitude={checkOutLat!} longitude={checkOutLng!}>
            <div className="drop-shadow-lg" title="Check-out">
              <MapPin
                className="h-7 w-7 text-red-600 fill-red-100 dark:text-red-400 dark:fill-red-900/50"
                strokeWidth={1.5}
              />
            </div>
          </Marker>
        )}
      </Map>

      {/* Legend */}
      <div className="flex items-center gap-3 px-3 py-1.5 bg-muted/50 text-[10px] text-muted-foreground">
        {hasLogement && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Logement
          </span>
        )}
        {hasCheckIn && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Check-in
          </span>
        )}
        {hasCheckOut && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Check-out
          </span>
        )}
      </div>
    </div>
  );
}
