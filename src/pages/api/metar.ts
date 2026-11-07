import type { APIRoute } from 'astro';
import { parseMetar, STATIONS, type Metar } from '../../lib/metar';

export const prerender = false;

// GET /api/metar → { stations: { KLXL: Metar | null, ... }, fetchedAt }
// Cached at the edge for 5 minutes (METARs update hourly or on change). Never throws: an upstream
// failure returns nulls so the page simply shows calm-wind traffic.
export const GET: APIRoute = async () => {
  const ids = STATIONS.join(',');
  const stations: Record<string, Metar | null> = Object.fromEntries(STATIONS.map((s) => [s, null]));
  try {
    const res = await fetch(`https://aviationweather.gov/api/data/metar?ids=${ids}&format=json`, {
      headers: { 'user-agent': 'lakes-area-aviation-site/1.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const list = (await res.json()) as unknown;
      if (Array.isArray(list)) {
        for (const r of list) {
          const m = parseMetar(r as Record<string, unknown>);
          // Keep the newest observation per station.
          if (m && m.station in stations && (!stations[m.station] || (m.observedAt ?? '') > (stations[m.station]!.observedAt ?? ''))) stations[m.station] = m;
        }
      }
    }
  } catch {
    // fall through with nulls
  }
  return new Response(JSON.stringify({ stations, fetchedAt: new Date().toISOString() }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=900',
    },
  });
};
