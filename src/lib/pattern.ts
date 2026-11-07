// Airport traffic-pattern simulation. Pure functions, no DOM.
//
// A rectangular pattern is flown in a local runway frame measured in feet: x runs along the active
// runway from its landing threshold (x = 0) to its far end (x = runwayFt); y is positive toward the
// pattern side (left of a pilot on final for left traffic). Every aircraft flies the same path at the
// same leg speeds, separated by an equal share of the circuit time, so separation never changes.
// The runway zone (final from the base turn, the runway, and departure up to the crosswind turn) is
// sized so its duration is shorter than that spacing: at most one aircraft is ever in it.

export type Pt = { x: number; y: number };
export type Side = 'left' | 'right';
export type RunwayEnd = { name: string; trueHeading: number; side: Side };
export type Field = {
  ident: string;
  name: string;
  elevationFt: number;
  /** Pattern altitude above the field. */
  tpaAglFt: number;
  runwayFt: number;
  /** Both ends of the main runway; ends[0] lands at `a` toward `b`. */
  ends: readonly [RunwayEnd, RunwayEnd];
  /** Runway used in calm or variable wind under 5 kt. */
  calmRunway: string;
  /** Landing threshold of ends[0] and of ends[1] in the aerial image's own pixels. */
  a: Pt;
  b: Pt;
  /** Downwind offset from the runway and leg extension past each end, feet. */
  downwindFt: number;
  extensionFt: number;
  aircraft: readonly string[];
  /** METAR station used for wind and temperature (nearest reporting station). */
  wxStation: string;
};
export type Wind = { dirTrue: number | null; kt: number; gustKt?: number | null };

export type Leg = 'takeoff' | 'climbout' | 'upwind' | 'crosswind' | 'downwind' | 'base' | 'final' | 'rollout';
// One aircraft at a time on final or on the runway surface. Separately (checked in tests): nobody
// touches down until the aircraft ahead is airborne and past the departure end.
export const RUNWAY_ZONE: readonly Leg[] = ['final', 'rollout', 'takeoff'];
export const ON_GROUND: readonly Leg[] = ['rollout', 'takeoff'];

type Waypoint = { x: number; y: number; agl: number; kias: number; leg: Leg };

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const norm360 = (d: number) => ((d % 360) + 360) % 360;
const KT_TO_FPS = 1.68781;

export function headwindKt(w: Wind, runwayHeading: number) {
  return w.dirTrue === null ? 0 : w.kt * Math.cos(rad(w.dirTrue - runwayHeading));
}
export function crosswindKt(w: Wind, runwayHeading: number) {
  return w.dirTrue === null ? 0 : w.kt * Math.sin(rad(w.dirTrue - runwayHeading));
}

/** Active runway: best headwind; the calm-wind runway under 5 kt, variable, or with no weather. */
export function activeRunway(f: Field, w: Wind | null): { end: RunwayEnd; reversed: boolean } {
  const calmIdx = f.ends[0].name === f.calmRunway ? 0 : 1;
  let idx = calmIdx;
  if (w && w.dirTrue !== null && w.kt >= 5) idx = headwindKt(w, f.ends[0].trueHeading) >= headwindKt(w, f.ends[1].trueHeading) ? 0 : 1;
  return { end: f.ends[idx]!, reversed: idx === 1 };
}

/** The circuit as waypoints in the local runway frame; each waypoint names the leg that STARTS there. */
export function circuit(f: Field): Waypoint[] {
  const L = f.runwayFt, ext = f.extensionFt, off = f.downwindFt, tpa = f.tpaAglFt;
  return [
    { x: 0.08 * L, y: 0, agl: 0, kias: 55, leg: 'takeoff' },
    { x: 0.45 * L, y: 0, agl: 0, kias: 65, leg: 'climbout' },
    { x: L, y: 0, agl: tpa * 0.3, kias: 72, leg: 'upwind' },
    { x: L + ext, y: 0, agl: tpa * 0.6, kias: 75, leg: 'crosswind' },
    { x: L + ext, y: off, agl: tpa, kias: 85, leg: 'downwind' },
    { x: -ext, y: off, agl: tpa, kias: 80, leg: 'base' },
    { x: -ext, y: 0, agl: tpa * 0.55, kias: 70, leg: 'final' },
    { x: 0.08 * L, y: 0, agl: 0, kias: 60, leg: 'rollout' },
    { x: 0.08 * L, y: 0, agl: 0, kias: 55, leg: 'takeoff' },
  ];
}

export type Segment = { from: Waypoint; to: Waypoint; lengthFt: number; seconds: number; trackDeg: number };

/**
 * Segments with real ground speeds for this wind. Track is measured in the local frame
 * (0 = along the runway toward its far end, 90 = toward the pattern side).
 */
export function segments(f: Field, w: Wind | null): Segment[] {
  const { end, reversed } = activeRunway(f, w);
  const pts = circuit(f);
  const out: Segment[] = [];
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p = pts[i]!, q = pts[i + 1]!;
    const dx = q.x - p.x, dy = q.y - p.y;
    const lengthFt = Math.hypot(dx, dy);
    const trackDeg = deg(Math.atan2(dy, dx));
    let seconds: number;
    if (p.leg === 'takeoff' || p.leg === 'rollout') {
      // Touch-and-go ground roll: never stops; average of the touchdown/rotation speeds.
      const v = Math.max(20, (p.kias + q.kias) / 2) * KT_TO_FPS;
      seconds = lengthFt / Math.max(10, v - (w ? headwindKt(w, end.trueHeading) : 0) * KT_TO_FPS * 0.5);
    } else {
      // Ground speed = airspeed minus the wind component along the track.
      const trackTrue = localToTrue(trackDeg, end, reversed);
      const along = w && w.dirTrue !== null ? w.kt * Math.cos(rad(w.dirTrue - trackTrue)) : 0;
      const gs = Math.max(35, (p.kias + q.kias) / 2 - along) * KT_TO_FPS;
      seconds = lengthFt / gs;
    }
    out.push({ from: p, to: q, lengthFt, seconds, trackDeg });
  }
  return out;
}

/** Local track (deg) to a true course for the active runway end. */
export function localToTrue(localDeg: number, end: RunwayEnd, _reversed: boolean) {
  // Local +y is the pattern side: left of the landing direction for left traffic, right for right.
  const sideSign = end.side === 'left' ? -1 : 1;
  return norm360(end.trueHeading + sideSign * localDeg);
}

export const lapSeconds = (segs: Segment[]) => segs.reduce((s, g) => s + g.seconds, 0);

export function zoneSeconds(segs: Segment[]) {
  return segs.filter((g) => RUNWAY_ZONE.includes(g.from.leg)).reduce((s, g) => s + g.seconds, 0);
}

export type Sample = { x: number; y: number; agl: number; leg: Leg; trackDeg: number; headingDeg: number; kias: number; gsKt: number };

/** Position `t` seconds into the circuit (wraps). */
export function sampleAt(segs: Segment[], t: number, f: Field, w: Wind | null): Sample {
  const lap = lapSeconds(segs);
  let r = ((t % lap) + lap) % lap;
  const { end, reversed } = activeRunway(f, w);
  for (const g of segs) {
    if (r <= g.seconds || g === segs[segs.length - 1]) {
      const k = g.seconds > 0 ? Math.min(1, r / g.seconds) : 0;
      // Speed changes are small on every leg, so position is linear in time.
      const e = k;
      const x = g.from.x + (g.to.x - g.from.x) * e;
      const y = g.from.y + (g.to.y - g.from.y) * e;
      const agl = g.from.agl + (g.to.agl - g.from.agl) * k;
      const kias = g.from.kias + (g.to.kias - g.from.kias) * k;
      // Wind correction: the nose points into the crosswind so the track over the ground stays straight.
      const onGround = g.from.leg === 'takeoff' || g.from.leg === 'rollout';
      const trackTrue = localToTrue(g.trackDeg, end, reversed);
      const xw = !onGround && w && w.dirTrue !== null ? w.kt * Math.sin(rad(w.dirTrue - trackTrue)) : 0;
      const wca = kias > 30 ? deg(Math.asin(Math.max(-0.5, Math.min(0.5, xw / kias)))) : 0;
      const sideSign = end.side === 'left' ? -1 : 1;
      const headingLocal = g.trackDeg + sideSign * wca; // positive xw (wind from the right of track) turns the nose right
      const along = w && w.dirTrue !== null ? w.kt * Math.cos(rad(w.dirTrue - trackTrue)) : 0;
      return { x, y, agl, leg: g.from.leg, trackDeg: g.trackDeg, headingDeg: headingLocal, kias, gsKt: Math.max(0, kias - (onGround ? 0 : along)) };
    }
    r -= g.seconds;
  }
  const p = segs[0]!.from;
  return { x: p.x, y: p.y, agl: 0, leg: 'takeoff', trackDeg: 0, headingDeg: 0, kias: 0, gsKt: 0 };
}

/**
 * Departure times (seconds into the lap) for each aircraft: equal spacing. The pattern is valid only if
 * the runway zone is shorter than that spacing; `fleetFor` drops aircraft until it is.
 */
export function fleetFor(f: Field, segs: Segment[]) {
  const lap = lapSeconds(segs), zone = zoneSeconds(segs);
  // Time from touchdown until airborne past the departure end: the follower may not touch down sooner.
  const overRunway = segs.filter((g) => g.from.leg === 'rollout' || g.from.leg === 'takeoff' || g.from.leg === 'climbout').reduce((s, g) => s + g.seconds, 0);
  const need = Math.max(zone, overRunway);
  let n = f.aircraft.length;
  // Keep a 15% buffer so two aircraft are never even close to a conflict.
  while (n > 1 && need > (lap / n) * 0.85) n -= 1;
  return f.aircraft.slice(0, n).map((reg, i) => ({ reg, offset: (lap * i) / n }));
}

/** Local runway frame (feet) to aerial image pixels for the active runway. */
export function toImage(f: Field, reversed: boolean, side: Side, p: Pt): Pt {
  const from = reversed ? f.b : f.a, to = reversed ? f.a : f.b;
  const dx = to.x - from.x, dy = to.y - from.y;
  const lenPx = Math.hypot(dx, dy) || 1;
  const s = lenPx / f.runwayFt; // px per ft
  const u = { x: dx / lenPx, y: dy / lenPx };
  // Image y points down: the left of travel direction u is (u.y, -u.x).
  const n = side === 'left' ? { x: u.y, y: -u.x } : { x: -u.y, y: u.x };
  return { x: from.x + (u.x * p.x + n.x * p.y) * s, y: from.y + (u.y * p.x + n.y * p.y) * s };
}

/** Rotation (deg, clockwise in image space, 0 = nose up) of a local-frame heading. */
export function imageRotation(f: Field, reversed: boolean, side: Side, localHeadingDeg: number) {
  const o = toImage(f, reversed, side, { x: 0, y: 0 });
  const t = toImage(f, reversed, side, { x: Math.cos(rad(localHeadingDeg)) * 100, y: Math.sin(rad(localHeadingDeg)) * 100 });
  return norm360(deg(Math.atan2(t.y - o.y, t.x - o.x)) + 90);
}

/** CTAF-style position report when an aircraft starts a leg. */
export function positionReport(leg: Leg, runway: string, side: Side, field: string, reg: string) {
  const tail = reg.replace(/^N/, '').slice(-3);
  const s = side === 'left' ? 'left' : 'right';
  const call: Partial<Record<Leg, string>> = {
    takeoff: `departing runway ${runway}`,
    crosswind: `turning ${s} crosswind ${runway}`,
    downwind: `${s} downwind ${runway}, touch-and-go`,
    base: `turning ${s} base ${runway}`,
    final: `final ${runway}, touch-and-go`,
  };
  const c = call[leg];
  return c ? `${field} traffic, ${tail}, ${c}` : null;
}
