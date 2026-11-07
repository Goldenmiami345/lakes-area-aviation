import { describe, expect, it } from 'vitest';
import { FIELDS } from './fields';
import { activeRunway, fleetFor, lapSeconds, ON_GROUND, RUNWAY_ZONE, sampleAt, segments, toImage, type Field, type Wind } from './pattern';

const field: Field = {
  ident: 'KTST', name: 'Test', elevationFt: 1000, tpaAglFt: 1000, runwayFt: 4000,
  ends: [{ name: '13', trueHeading: 130, side: 'left' }, { name: '31', trueHeading: 310, side: 'left' }],
  calmRunway: '13', a: { x: 400, y: 500 }, b: { x: 900, y: 900 },
  downwindFt: 3000, extensionFt: 1500, aircraft: ['N8570B', 'N4383P', 'N46201'], wxStation: 'KTST',
};

const winds: (Wind | null)[] = [null, { dirTrue: null, kt: 3 }, { dirTrue: 130, kt: 12 }, { dirTrue: 310, kt: 18 }, { dirTrue: 220, kt: 15 }, { dirTrue: 40, kt: 25, gustKt: 32 }, { dirTrue: 0, kt: 4 }];

describe('active runway', () => {
  it('uses the calm runway with no, variable, or light wind', () => {
    expect(activeRunway(field, null).end.name).toBe('13');
    expect(activeRunway(field, { dirTrue: null, kt: 8 }).end.name).toBe('13');
    expect(activeRunway(field, { dirTrue: 310, kt: 4 }).end.name).toBe('13');
  });
  it('lands into the wind', () => {
    expect(activeRunway(field, { dirTrue: 300, kt: 10 }).end.name).toBe('31');
    expect(activeRunway(field, { dirTrue: 150, kt: 10 }).end.name).toBe('13');
  });
});

describe.each([['synthetic', field], ...Object.entries(FIELDS)] as [string, Field][])('separation at %s', (_name, field) => {
  for (const w of winds) {
    it(`never has two aircraft in the runway zone (wind ${JSON.stringify(w)})`, () => {
      const segs = segments(field, w);
      const lap = lapSeconds(segs);
      const fleet = fleetFor(field, segs);
      expect(fleet.length).toBeGreaterThanOrEqual(2);
      for (let t = 0; t < lap * 2; t += 0.25) {
        const inZone = fleet.filter((a) => RUNWAY_ZONE.includes(sampleAt(segs, t + a.offset, field, w).leg)).length;
        expect(inZone).toBeLessThanOrEqual(1);
      }
    });
    it(`never touches down before the aircraft ahead is airborne past the runway end (wind ${JSON.stringify(w)})`, () => {
      const segs = segments(field, w);
      const lap = lapSeconds(segs);
      const fleet = fleetFor(field, segs);
      for (let t = 0; t < lap * 2; t += 0.25) {
        const ss = fleet.map((a) => sampleAt(segs, t + a.offset, field, w));
        const grounded = ss.filter((s) => ON_GROUND.includes(s.leg)).length;
        const overRunway = ss.filter((s) => ON_GROUND.includes(s.leg) || s.leg === 'climbout').length;
        if (grounded > 0) expect(overRunway).toBe(1);
      }
    });
    it(`keeps at least 800 ft between aircraft everywhere (wind ${JSON.stringify(w)})`, () => {
      const segs = segments(field, w);
      const lap = lapSeconds(segs);
      const fleet = fleetFor(field, segs);
      for (let t = 0; t < lap; t += 0.5) {
        const ps = fleet.map((a) => sampleAt(segs, t + a.offset, field, w));
        for (let i = 0; i < ps.length; i += 1) for (let j = i + 1; j < ps.length; j += 1) {
          expect(Math.hypot(ps[i]!.x - ps[j]!.x, ps[i]!.y - ps[j]!.y)).toBeGreaterThan(800);
        }
      }
    });
  }
});

describe('fleet size', () => {
  it('reports how many aircraft each field can fly in each wind', () => {
    for (const [id, f] of Object.entries(FIELDS)) for (const w of winds) console.log(id, JSON.stringify(w), fleetFor(f, segments(f, w)).length, Math.round(lapSeconds(segments(f, w))) + 's lap');
  });
});

describe('flight path', () => {
  it('stays on the runway centreline while on the ground and climbs only after rotation', () => {
    const segs = segments(field, null);
    for (let t = 0; t < lapSeconds(segs); t += 0.2) {
      const s = sampleAt(segs, t, field, null);
      if (s.leg === 'takeoff' || s.leg === 'rollout') { expect(s.agl).toBe(0); expect(Math.abs(s.y)).toBeLessThan(1e-6); }
      if (s.leg === 'downwind') expect(s.agl).toBeCloseTo(field.tpaAglFt, 6);
    }
  });
  it('flies the pattern on the correct side', () => {
    const segs = segments(field, null);
    const down = Array.from({ length: 400 }, (_, i) => sampleAt(segs, (i / 400) * lapSeconds(segs), field, null)).find((s) => s.leg === 'downwind')!;
    expect(down.y).toBeGreaterThan(0);
    // Left traffic for 13 (a→b goes down-right in the image): the pattern side is up-right of the runway.
    const img = toImage(field, false, 'left', { x: 2000, y: field.downwindFt });
    const mid = toImage(field, false, 'left', { x: 2000, y: 0 });
    const ux = 500, uy = 400; // a→b
    const cross = ux * (img.y - mid.y) - uy * (img.x - mid.x); // < 0 → left of travel in y-down image space
    expect(cross).toBeLessThan(0);
  });
  it('maps the thresholds onto the image runway ends', () => {
    expect(toImage(field, false, 'left', { x: 0, y: 0 })).toEqual(field.a);
    const end = toImage(field, false, 'left', { x: field.runwayFt, y: 0 });
    expect(end.x).toBeCloseTo(field.b.x, 6); expect(end.y).toBeCloseTo(field.b.y, 6);
    expect(toImage(field, true, 'left', { x: 0, y: 0 })).toEqual(field.b);
  });
  it('crabs into a crosswind on final and holds no crab in calm air', () => {
    const calm = segments(field, null), windy = segments(field, { dirTrue: 220, kt: 15 });
    const at = (segs: ReturnType<typeof segments>, w: Wind | null) => {
      for (let t = 0; t < lapSeconds(segs); t += 0.2) { const s = sampleAt(segs, t, field, w); if (s.leg === 'final') return s; }
      throw new Error('no final');
    };
    const c = at(calm, null);
    expect(c.headingDeg - c.trackDeg).toBeCloseTo(0, 6);
    const w = at(windy, { dirTrue: 220, kt: 15 });
    expect(Math.abs(w.headingDeg - w.trackDeg)).toBeGreaterThan(5);
  });
});
