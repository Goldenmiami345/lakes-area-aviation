// METAR parsing shared by the API route and the browser. Source: aviationweather.gov JSON API.

export type Metar = {
  station: string;
  observedAt: string | null;
  /** Wind direction in degrees true; null when variable. */
  dir: number | null;
  kt: number;
  gust: number | null;
  tempC: number | null;
  dewC: number | null;
  visSm: number | null;
  altimInHg: number | null;
  /** VFR / MVFR / IFR / LIFR as published. */
  category: 'VFR' | 'MVFR' | 'IFR' | 'LIFR' | null;
  ceilingFt: number | null;
  raw: string;
};

/** Stations the site is allowed to request (field or nearest reporting station). */
export const STATIONS = ['KLXL', 'KDEN', 'KSEZ'] as const;

type Raw = Record<string, unknown>;
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v.replace('+', ''))) ? Number(v.replace('+', '')) : null);

export function parseMetar(r: Raw): Metar | null {
  const station = typeof r['icaoId'] === 'string' ? r['icaoId'] : null;
  if (!station) return null;
  const wdir = r['wdir'];
  const clouds = Array.isArray(r['clouds']) ? (r['clouds'] as Raw[]) : [];
  const ceiling = clouds.filter((c) => c['cover'] === 'BKN' || c['cover'] === 'OVC' || c['cover'] === 'VV').map((c) => num(c['base'])).filter((b): b is number => b !== null);
  const cat = r['fltCat'];
  const obs = r['reportTime'] ?? r['obsTime'];
  return {
    station,
    observedAt: typeof obs === 'string' ? obs : typeof obs === 'number' ? new Date(obs * 1000).toISOString() : null,
    dir: wdir === 'VRB' ? null : num(wdir),
    kt: num(r['wspd']) ?? 0,
    gust: num(r['wgst']),
    tempC: num(r['temp']),
    dewC: num(r['dewp']),
    visSm: num(r['visib']),
    altimInHg: (() => { const a = num(r['altim']); return a === null ? null : a > 100 ? Math.round((a / 33.8639) * 100) / 100 : a; })(),
    category: cat === 'VFR' || cat === 'MVFR' || cat === 'IFR' || cat === 'LIFR' ? cat : null,
    ceilingFt: ceiling.length ? Math.min(...ceiling) : null,
    raw: typeof r['rawOb'] === 'string' ? r['rawOb'] : '',
  };
}

/** Density altitude (ft) from field elevation, temperature and altimeter setting. */
export function densityAltitude(elevationFt: number, m: Pick<Metar, 'tempC' | 'altimInHg'>) {
  if (m.tempC === null) return null;
  const pa = elevationFt + (29.92 - (m.altimInHg ?? 29.92)) * 1000;
  const isa = 15 - (2 * pa) / 1000;
  return Math.round((pa + 120 * (m.tempC - isa)) / 10) * 10;
}

export function windText(m: Pick<Metar, 'dir' | 'kt' | 'gust'>) {
  if (m.kt === 0) return 'Calm';
  const d = m.dir === null ? 'VRB' : `${String(m.dir).padStart(3, '0')}°`;
  return `${d} ${m.kt}${m.gust ? `G${m.gust}` : ''} kt`;
}
