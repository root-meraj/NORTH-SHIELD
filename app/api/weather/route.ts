/**
 * GET /api/weather?lat=<n>&lng=<n>  ->  live conditions for the risk model
 * ------------------------------------------------------------------
 * Open-Meteo Forecast API — free, no key. Returns the fields the
 * predictions page needs so an operator can load real conditions instead
 * of guessing at the sliders.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  if (!lat || !lng) {
    return Response.json({ error: "Pass ?lat=&lng=" }, { status: 400 });
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lng);
  url.searchParams.set("hourly", "precipitation,soil_moisture_3_to_9cm");
  url.searchParams.set("daily", "precipitation_sum");
  url.searchParams.set("past_days", "7");
  url.searchParams.set("forecast_days", "2");
  url.searchParams.set("timezone", "auto");

  let data: {
    hourly?: { time: string[]; precipitation: number[]; soil_moisture_3_to_9cm: number[] };
    daily?: { time: string[]; precipitation_sum: number[] };
  };
  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error();
    data = await res.json();
  } catch {
    return Response.json({ error: "Open-Meteo unreachable" }, { status: 502 });
  }

  const dailySums = data.daily?.precipitation_sum ?? [];
  const rainfall7dMm = Math.round(dailySums.slice(0, 7).reduce((s, v) => s + (v || 0), 0));

  // Next 24 forecast hours of precipitation.
  const hours = data.hourly?.time ?? [];
  const now = Date.now();
  let rainfall24hMm = 0;
  for (let i = 0; i < hours.length; i++) {
    const t = new Date(hours[i]).getTime();
    if (t >= now && t <= now + 24 * 3600_000) rainfall24hMm += data.hourly!.precipitation[i] || 0;
  }

  // Latest soil moisture reading -> % of a wet reference (0.45 m3/m3).
  const sm = data.hourly?.soil_moisture_3_to_9cm ?? [];
  const latestSoil = sm.filter((v) => v != null).at(-1) ?? 0;
  const soilSaturationPct = Math.round(Math.min(100, (latestSoil / 0.45) * 100));

  return Response.json({
    rainfall24hMm: Math.round(rainfall24hMm),
    rainfall7dMm,
    soilSaturationPct,
  });
}
