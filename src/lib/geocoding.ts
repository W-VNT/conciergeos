/**
 * Geocoding utilities using Mapbox Geocoding API
 * https://docs.mapbox.com/api/search/geocoding/
 */

interface MapboxGeocodeResponse {
  features: Array<{
    geometry: {
      coordinates: [number, number]; // [longitude, latitude]
    };
    place_name: string;
    relevance: number;
  }>;
}

interface GeocodeResult {
  latitude: number;
  longitude: number;
  place_name: string;
}

/**
 * Geocode an address to GPS coordinates using Mapbox
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN is not configured");
  }

  if (!address || address.trim().length < 3) {
    throw new Error("Address is too short");
  }

  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${token}&limit=1`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data: MapboxGeocodeResponse = await response.json();

    if (!data.features || data.features.length === 0) {
      return null; // No results found
    }

    const feature = data.features[0];
    const [longitude, latitude] = feature.geometry.coordinates;

    return {
      latitude,
      longitude,
      place_name: feature.place_name,
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    throw error;
  }
}

/**
 * Build a full address string from logement fields
 */
export function buildAddressString(
  address_line1?: string | null,
  postal_code?: string | null,
  city?: string | null,
  country?: string | null
): string {
  const parts = [address_line1, postal_code, city, country].filter(
    (part) => part && part.trim().length > 0
  );
  return parts.join(", ");
}
