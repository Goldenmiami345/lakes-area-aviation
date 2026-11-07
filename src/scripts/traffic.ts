// Animates the simulated traffic pattern on each airport aerial and fills the ATIS strip with live
// METAR data. Every rule (runway choice, spacing, one aircraft on final or the runway) lives in
// src/lib/pattern.ts and is unit-tested; this file only draws.
import { FIELDS, type FieldId } from '../lib/fields';
import { activeRunway, circuit, fleetFor, imageRotation, positionReport, sampleAt, segments, toImage, type Field, type Leg, type Wind } from '../lib/pattern';
import { densityAltitude, windText, type Metar } from '../lib/metar';

/** Pattern time runs faster than real time so a visitor sees the whole circuit (~45 s per lap). */
const TIME_SCALE = 2.4;
const SVGNS = 'http://www.w3.org/2000/svg';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const phoneMq = matchMedia('(max-width: 639px) and (orientation: portrait)');

// Top-view silhouettes, nose toward -y, in a 40-unit wingspan box centred on the origin.
const HIGH_WING = 'M-1.6-13 1.6-13 2.2-6 20-5 20-1.5 2.2-.8 1.4 9 7 10.5 7 13-1.4 12.6-1.4 12.6-7 13-7 10.5-1.4 9-2.2-.8-20-1.5-20-5-2.2-6Z';
const TWIN = 'M-1.8-12 1.8-12 2.4-4 6.5-4.6 6.5-10 9.5-10 9.5-4.2 20-3.4 20 0 9.5.4 9.5 4 6.5 4 6.5.8 2.4 1 1.6 10 7.5 11.5 7.5 13.6-1.6 13.2 1.6 13.2-7.5 13.6-7.5 11.5-1.6 10-2.4 1-6.5.8-6.5 4-9.5 4-9.5.4-20 0-20-3.4-9.5-4.2-9.5-10-6.5-10-6.5-4.6-2.4-4Z';
const shapeFor = (reg: string) => (reg === 'N4383P' ? TWIN : HIGH_WING);
const wingspanFt = (reg: string) => (reg === 'N4383P' ? 37 : reg === 'N6641F' ? 33 : reg === 'N96150' || reg === 'N11059' ? 34 : 36);

type Plane = { reg: string; offset: number; g: SVGGElement; ac: SVGGElement; shadow: SVGPathElement; tag: SVGTextElement; leg: Leg | null };
type Scene = { id: FieldId; field: Field; svg: SVGSVGElement; path: SVGPathElement; planes: Plane[]; wind: Wind | null; metar: Metar | null; segs: ReturnType<typeof segments>; reversed: boolean; side: 'left' | 'right'; runway: string; px: number; lastCall: string };

const scenes: Scene[] = [];
for (const svg of document.querySelectorAll<SVGSVGElement>('svg[data-field]')) {
  const id = svg.dataset.field as FieldId;
  const field = FIELDS[id];
  if (!field) continue;
  scenes.push({ id, field, svg, path: svg.querySelector('[data-pattern]')!, planes: [], wind: null, metar: null, segs: [], reversed: false, side: 'left', runway: field.calmRunway, px: 1, lastCall: '' });
}

function setView(s: Scene) {
  const v = s.svg.dataset.phoneView;
  s.svg.setAttribute('viewBox', v && phoneMq.matches ? v : '0 0 1500 1500');
  // Screen pixels per image pixel, so symbols and labels keep a constant on-screen size.
  const ctm = s.svg.getScreenCTM();
  s.px = ctm && ctm.a > 0 ? ctm.a : 1;
}

function build(s: Scene) {
  s.segs = segments(s.field, s.wind);
  const { end, reversed } = activeRunway(s.field, s.wind);
  s.reversed = reversed; s.side = end.side; s.runway = end.name;
  const pts = circuit(s.field).map((p) => toImage(s.field, reversed, end.side, p));
  s.path.setAttribute('d', `M${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L')}`);
  const host = s.svg.querySelector('[data-planes]')!;
  host.replaceChildren();
  s.planes = fleetFor(s.field, s.segs).map(({ reg, offset }) => {
    const g = document.createElementNS(SVGNS, 'g'); g.setAttribute('class', 'ac');
    const shadow = document.createElementNS(SVGNS, 'path'); shadow.setAttribute('class', 'shadow'); shadow.setAttribute('d', shapeFor(reg));
    const ac = document.createElementNS(SVGNS, 'g');
    const ring = document.createElementNS(SVGNS, 'circle'); ring.setAttribute('class', 'ring'); ring.setAttribute('r', '30');
    const body = document.createElementNS(SVGNS, 'path'); body.setAttribute('class', 'body'); body.setAttribute('d', shapeFor(reg));
    ac.append(ring, body);
    const tag = document.createElementNS(SVGNS, 'text'); tag.setAttribute('class', 'tag');
    g.append(shadow, ac, tag);
    host.append(g);
    return { reg, offset, g, ac, shadow, tag, leg: null };
  });
}

function draw(s: Scene, now: number) {
  const t = reduce ? 0 : (now / 1000) * TIME_SCALE;
  const k = 1 / s.px; // image px per screen px
  for (const p of s.planes) {
    const sm = sampleAt(s.segs, t + p.offset, s.field, s.wind);
    const at = toImage(s.field, s.reversed, s.side, sm);
    const rot = imageRotation(s.field, s.reversed, s.side, sm.headingDeg);
    // Symbol size: true wingspan × 3 (a 36 ft span is ~4 px on the aerial), never under 22 screen px.
    const ftPerImgPx = s.field.runwayFt / Math.hypot(s.field.b.x - s.field.a.x, s.field.b.y - s.field.a.y);
    const span = Math.max(22 * k, (wingspanFt(p.reg) / ftPerImgPx) * 3);
    const sc = span / 40;
    const lift = (sm.agl / s.field.tpaAglFt) * 14 * k; // shadow drifts down-right as the airplane climbs
    p.shadow.setAttribute('transform', `translate(${(at.x + lift).toFixed(1)} ${(at.y + lift).toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sc.toFixed(3)})`);
    p.ac.setAttribute('transform', `translate(${at.x.toFixed(1)} ${at.y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sc.toFixed(3)})`);
    (p.ac.firstChild as SVGCircleElement).setAttribute('r', String(((span / 2 + 7 * k) / sc).toFixed(2)));
    const msl = Math.round((s.field.elevationFt + sm.agl) / 100) * 100;
    p.tag.setAttribute('x', (at.x + span / 2 + 10 * k).toFixed(1));
    p.tag.setAttribute('y', (at.y - 2 * k).toFixed(1));
    p.tag.style.fontSize = `${(12.5 * k).toFixed(2)}px`;
    p.tag.style.strokeWidth = `${(3 * k).toFixed(2)}px`;
    if (p.tag.dataset.v !== `${msl}|${sm.leg}`) {
      p.tag.dataset.v = `${msl}|${sm.leg}`;
      p.tag.innerHTML = `<tspan>${p.reg}</tspan><tspan class="sub" x="${p.tag.getAttribute('x')}" dy="1.15em">${msl.toLocaleString('en-US')} ft</tspan>`;
    }
    if (sm.leg !== p.leg) {
      if (p.leg !== null) { const call = positionReport(sm.leg, s.runway, s.side, s.field.name, p.reg); if (call) s.lastCall = call; }
      p.leg = sm.leg;
    }
  }
}

// ---- ATIS strip -----------------------------------------------------------------------------
function minutesAgo(iso: string | null) {
  if (!iso) return null;
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  return Number.isFinite(m) && m >= 0 ? m : null;
}
function atisHtml(s: Scene) {
  const m = s.metar;
  const cat = m?.category ?? null;
  const da = m ? densityAltitude(s.field.elevationFt, m) : null;
  const ago = minutesAgo(m?.observedAt ?? null);
  const parts = [
    `<span class="atis-id">${s.field.ident}</span>`,
    m ? `<span><em>Wind</em> ${windText(m)}</span>` : `<span><em>Wind</em> calm</span>`,
    `<span><em>Runway</em> ${s.runway}, ${s.side} traffic</span>`,
    m?.tempC != null ? `<span><em>Temp</em> ${m.tempC}°C</span>` : '',
    m?.altimInHg != null ? `<span><em>Altimeter</em> ${m.altimInHg.toFixed(2)}</span>` : '',
    da != null ? `<span><em>Density alt</em> ${da.toLocaleString('en-US')} ft</span>` : '',
    cat ? `<span class="cat cat-${cat.toLowerCase()}">${cat}</span>` : '',
  ].filter(Boolean).join('');
  const source = m ? `Live METAR from ${m.station}${ago !== null ? `, ${ago < 1 ? 'just now' : `${ago} min ago`}` : ''}. Traffic is simulated.` : 'Weather unavailable right now. Traffic is simulated in calm wind.';
  return `<div class="atis-row">${parts}</div><p class="atis-call" data-call>${s.lastCall}</p><p class="atis-src">${source}</p>`;
}

let activeScene: Scene | null = null;
const atis = document.querySelector<HTMLElement>('[data-atis]');
const journey = atis?.closest<HTMLElement>('[data-journey]');
const paintAtis = () => { if (atis && activeScene) atis.innerHTML = atisHtml(activeScene); };
journey?.addEventListener('journey:active', (e) => { activeScene = scenes[(e as CustomEvent<number>).detail] ?? null; paintAtis(); });
activeScene = scenes[0] ?? null;

// ---- loop -----------------------------------------------------------------------------------
let visible = false, raf = 0, lastCallShown = '';
const loop = (now: number) => {
  for (const s of scenes) {
    const layer = s.svg.closest<HTMLElement>('[data-layer]');
    if (layer && layer.style.visibility === 'hidden') continue;
    draw(s, now);
  }
  if (activeScene && atis && activeScene.lastCall !== lastCallShown) {
    lastCallShown = activeScene.lastCall;
    const el = atis.querySelector<HTMLElement>('[data-call]');
    if (el) { el.textContent = lastCallShown; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  }
  if (visible && !reduce) raf = requestAnimationFrame(loop);
};
const start = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); };
const resize = () => { scenes.forEach(setView); if (!visible || reduce) start(); };

if (scenes.length && journey) {
  scenes.forEach((s) => { setView(s); build(s); });
  paintAtis();
  new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; if (visible) { scenes.forEach(setView); start(); } }, { rootMargin: '200px' }).observe(journey);
  addEventListener('resize', resize);
  phoneMq.addEventListener('change', resize);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else if (visible) start(); });
  // Live weather: one request, cached at the edge for five minutes.
  fetch('/api/metar').then((r) => (r.ok ? r.json() : null)).then((data: { stations: Record<string, Metar | null> } | null) => {
    if (!data) return;
    for (const s of scenes) {
      const m = data.stations[s.field.wxStation] ?? null;
      s.metar = m;
      s.wind = m ? { dirTrue: m.dir, kt: m.kt, gustKt: m.gust } : null;
      build(s);
    }
    paintAtis(); start();
  }).catch(() => {});
}
