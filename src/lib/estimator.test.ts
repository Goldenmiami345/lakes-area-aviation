import { describe, expect, it } from 'vitest';
import { estimate, RATINGS } from './estimator';
import { PROGRAMS } from '../data/programs';

const base = { housing: false, car: false, housingPerNight: 30, carPerDay: 20 };

describe('estimator', () => {
  it('uses the same prices as the program pages', () => {
    const published = PROGRAMS.flatMap((p) => p.courses.map((c) => c.asLowAs));
    for (const r of RATINGS) expect(published).toContain(r.price);
  });
  it('adds days, travel and a 20% contingency', () => {
    const e = estimate({ ...base, held: ['ppl', 'ir', 'csel'], want: ['cfi', 'cfii'], housing: true, car: true });
    expect(e.days).toBe(12);
    expect(e.training).toBe(8275);
    expect(e.housing).toBe(360);
    expect(e.car).toBe(240);
    expect(e.contingency).toBe(Math.round((8275 + 360 + 240) * 0.2));
    expect(e.total).toBe(8275 + 360 + 240 + e.contingency);
    expect(e.missing).toEqual([]);
  });
  it('flags missing prerequisites, satisfied by ratings planned in the same trip', () => {
    expect(estimate({ ...base, held: [], want: ['ir'] }).missing.map((m) => m.rating.id)).toEqual(['ir']);
    expect(estimate({ ...base, held: [], want: ['ppl', 'ir'] }).missing).toEqual([]);
    const cfi = estimate({ ...base, held: ['ppl'], want: ['cfi'] }).missing[0]!;
    expect(cfi.needs).toEqual(['Commercial Single-Engine or Commercial Multi-Engine', 'Instrument Rating']);
  });
  it('ignores ratings already held and charges no car without housing', () => {
    const e = estimate({ ...base, held: ['ppl'], want: ['ppl', 'ir'], car: true });
    expect(e.ratings.map((r) => r.id)).toEqual(['ir']);
    expect(e.car).toBe(0);
  });
});
