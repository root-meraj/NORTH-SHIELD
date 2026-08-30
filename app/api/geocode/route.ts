/**
 * GET /api/geocode?q=<text>          -> { lat, lng, label }
 * GET /api/geocode?lat=<n>&lng=<n>    -> { label }   (reverse)
 * ------------------------------------------------------------------
 * OpenStreetMap Nominatim — free, no key. Their usage policy asks for a
 * real User-Agent with contact info and <=1 request/second. Set
 * NOMINATIM_EMAIL in the server env to identify the app.
 */

const CONTACT = process.env.NOMINATIM_EMAIL ?? "northshield@example.org";
const UA = `northshield-logistics/1.0 (${CONTACT})`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  try {
    if (q) {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", q);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("limit", "1");
      url.searchParams.set("countrycodes", "in");
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      const hits = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      if (!hits.length) return Response.json({ error: "No match" }, { status: 404 });
      return Response.json({
        lat: parseFloat(hits[0].lat),
        lng: parseFloat(hits[0].lon),
        label: hits[0].display_name,
      });
    }

    if (lat && lng) {
      const url = new URL("https://nominatim.openstreetmap.org/reverse");
      url.searchParams.set("lat", lat);
      url.searchParams.set("lon", lng);
      url.searchParams.set("format", "jsonv2");
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      const hit = (await res.json()) as { display_name?: string; error?: string };
      if (!hit.display_name) return Response.json({ error: "No match" }, { status: 404 });
      return Response.json({ label: hit.display_name });
    }

    return Response.json({ error: "Pass ?q= or ?lat=&lng=" }, { status: 400 });
  } catch {
    return Response.json({ error: "Geocoder unreachable" }, { status: 502 });
  }
}
