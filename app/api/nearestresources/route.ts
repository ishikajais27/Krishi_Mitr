import { NextRequest, NextResponse } from "next/server";

interface NearbySearchRequest {
  latitude: number;
  longitude: number;
  resourceType: "vet" | "agri_input" | "crop_storage";
}

interface Place {
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  opening_hours?: {
    open_now?: boolean;
  };
  photos?: Array<{ photo_reference: string }>;
  business_status?: string;
  types?: string[];
  distance?: number;
  phone?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
}

interface NearbySearchResponse {
  results: Place[];
  status: string;
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getSearchQuery(resourceType: string): string {
  const queries: Record<string, string[]> = {
    vet: ["veterinary", "veterinarian", "animal hospital", "pet clinic"],
    agri_input: [
      "agricultural supply",
      "seed store",
      "fertilizer dealer",
      "agri shop",
      "farm input",
    ],
    crop_storage: ["grain storage", "warehouse", "storage facility", "silo"],
  };
  return queries[resourceType]?.[0] || "nearby";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { latitude, longitude, resourceType } = body;

    if (
      !latitude ||
      !longitude ||
      !resourceType ||
      !["vet", "agri_input", "crop_storage"].includes(resourceType)
    ) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid parameters: latitude, longitude, resourceType",
        },
        { status: 400 },
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 },
      );
    }

    const searchQuery = getSearchQuery(resourceType);
    const radius = 50000; // 50km radius

    // Call Google Places API - Nearby Search
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
    );
    url.searchParams.append("location", `${latitude},${longitude}`);
    url.searchParams.append("radius", radius.toString());
    url.searchParams.append("keyword", searchQuery);
    url.searchParams.append("key", apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      return NextResponse.json(
        { error: `Google Places API error: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data: NearbySearchResponse = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return NextResponse.json(
        { error: `Places API error: ${data.status}` },
        { status: 400 },
      );
    }

    // Calculate distance and sort by proximity
    const resultsWithDistance = (data.results || [])
      .map((place) => ({
        ...place,
        distance: calculateDistance(
          latitude,
          longitude,
          place.geometry.location.lat,
          place.geometry.location.lng,
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5); // Return top 5 nearest

    return NextResponse.json({
      status: "success",
      resourceType,
      userLocation: { latitude, longitude },
      results: resultsWithDistance.map((place) => ({
        name: place.name,
        address: place.formatted_address,
        distance: parseFloat(place.distance.toFixed(2)),
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        isOpen: place.opening_hours?.open_now,
        phone: place.phone,
        website: place.website,
        rating: place.rating,
        userRatings: place.user_ratings_total,
        businessStatus: place.business_status,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
