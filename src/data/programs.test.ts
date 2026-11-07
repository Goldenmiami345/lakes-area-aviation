import { describe, expect, it } from 'vitest';
import { PROGRAMS, itemsTotal } from './programs';

describe('published estimates', () => {
  it('every hourly line item multiplies out', () => {
    for (const p of PROGRAMS) for (const c of p.courses) for (const i of c.items) if (i.hours !== undefined) expect(i.amount).toBe(i.hours * (i.rate ?? 0));
  });
  // The published "as low as" figures. Private Pilot rounds its ground-course and medical estimates;
  // MEI's published $4,475 is $75 above its own line items (flagged to the school). Zero to Hero's
  // "close to $40,000" also covers checkrides and related costs beyond its five priced stages.
  const tolerance: Record<string, number> = { 'Accelerated Private Pilot': 50, 'Multi-Engine Instructor (MEI)': 75, 'Complete career path': 1400 };
  for (const p of PROGRAMS) for (const c of p.courses) {
    it(`${c.name}: line items add up to the published figure`, () => {
      expect(Math.abs(itemsTotal(c) - c.asLowAs)).toBeLessThanOrEqual(tolerance[c.name] ?? 0);
    });
  }
});
